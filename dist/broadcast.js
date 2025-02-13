"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
class Broadcast {
  constructor() {
    this.controller = null;
    this.peer = null;
    this.outConns = [];
    this.inConns = [];
    this.outgoingBuffer = [];
    this.MAX_BUFFER_SIZE = 40;
    this.currentStream = null;
  }
  send(operation) {
    const operationJSON = JSON.stringify(operation);
    if (operation.type === 'insert' || operation.type === 'delete') {
      this.addToOutgoingBuffer(operationJSON);
    }
    this.outConns.forEach(conn => conn.send(operationJSON));
  }
  addToOutgoingBuffer(operation) {
    if (this.outgoingBuffer.length === this.MAX_BUFFER_SIZE) {
      this.outgoingBuffer.shift();
    }
    this.outgoingBuffer.push(operation);
  }
  processOutgoingBuffer(peerId) {
    const connection = this.outConns.find(conn => conn.peer === peerId);
    this.outgoingBuffer.forEach(op => {
      connection.send(op);
    });
  }
  bindServerEvents(targetPeerId, peer) {
    this.peer = peer;
    this.onOpen(targetPeerId);
    this.heartbeat = this.startPeerHeartBeat(peer);
  }
  startPeerHeartBeat(peer) {
    let timeoutId = 0;
    const heartbeat = () => {
      timeoutId = setTimeout(heartbeat, 20000);
      if (peer.socket._wsOpen()) {
        peer.socket.send({
          type: 'HEARTBEAT'
        });
      }
    };
    heartbeat();
    return {
      start: function () {
        if (timeoutId === 0) {
          heartbeat();
        }
      },
      stop: function () {
        clearTimeout(timeoutId);
        timeoutId = 0;
      }
    };
  }
  onOpen(targetPeerId) {
    this.peer.on('open', id => {
      this.controller.updateShareLink(id);
      this.onPeerConnection();
      this.onError();
      this.onDisconnect();
      this.controller.addToNetwork(id, this.controller.siteId, this.controller.userName);
      if (targetPeerId !== '0') {
        this.requestConnection(targetPeerId, id, this.controller.siteId, this.controller.userName);
      }
    });
  }
  onError() {
    this.peer.on("error", err => {
      const pid = String(err).replace("Error: Could not connect to peer ", "");
      this.removeFromConnections(pid);
      if (!this.peer.disconnected) {
        this.controller.findNewTarget();
      }
      this.controller.enableEditor();
    });
  }
  onDisconnect() {
    this.peer.on('disconnected', () => {
      this.controller.lostConnection();
    });
  }
  requestConnection(target, peerId, siteId, userName) {
    const conn = this.peer.connect(target);
    this.addToOutConns(conn);
    conn.on('open', () => {
      conn.send(JSON.stringify({
        type: 'connRequest',
        peerId: peerId,
        siteId: siteId,
        userName: userName
      }));
    });
  }
  evaluateRequest(peerId, siteId, userName) {
    if (this.hasReachedMax()) {
      this.forwardConnRequest(peerId, siteId, userName);
    } else {
      this.acceptConnRequest(peerId, siteId, userName);
    }
  }
  hasReachedMax() {
    const halfTheNetwork = Math.ceil(this.controller.network.length / 2);
    const tooManyInConns = this.inConns.length > Math.max(halfTheNetwork, 5);
    const tooManyOutConns = this.outConns.length > Math.max(halfTheNetwork, 5);
    return tooManyInConns || tooManyOutConns;
  }
  forwardConnRequest(peerId, siteId, userName) {
    const connected = this.outConns.filter(conn => conn.peer !== peerId);
    const randomIdx = Math.floor(Math.random() * connected.length);
    connected[randomIdx].send(JSON.stringify({
      type: 'connRequest',
      peerId: peerId,
      siteId: siteId,
      userName: userName
    }));
  }
  addToOutConns(connection) {
    if (!!connection && !this.isAlreadyConnectedOut(connection)) {
      this.outConns.push(connection);
    }
  }
  addToInConns(connection) {
    if (!!connection && !this.isAlreadyConnectedIn(connection)) {
      this.inConns.push(connection);
    }
  }
  addToNetwork(peerId, siteId, userName) {
    this.send({
      type: "add to network",
      newPeer: peerId,
      newSite: siteId,
      newUsername: userName
    });
  }
  removeFromNetwork(peerId) {
    this.send({
      type: "remove from network",
      oldPeer: peerId
    });
    this.controller.removeFromNetwork(peerId);
  }
  removeFromConnections(peer) {
    this.inConns = this.inConns.filter(conn => conn.peer !== peer);
    this.outConns = this.outConns.filter(conn => conn.peer !== peer);
    this.removeFromNetwork(peer);
  }
  isAlreadyConnectedOut(connection) {
    if (connection.peer) {
      return !!this.outConns.find(conn => conn.peer === connection.peer);
    } else {
      return !!this.outConns.find(conn => conn.peer.id === connection);
    }
  }
  isAlreadyConnectedIn(connection) {
    if (connection.peer) {
      return !!this.inConns.find(conn => conn.peer === connection.peer);
    } else {
      return !!this.inConns.find(conn => conn.peer.id === connection);
    }
  }
  onPeerConnection() {
    this.peer.on('connection', connection => {
      this.onConnection(connection);
      this.onData(connection);
      this.onConnClose(connection);
    });
  }
  acceptConnRequest(peerId, siteId, userName) {
    const connBack = this.peer.connect(peerId);
    this.addToOutConns(connBack);
    this.controller.addToNetwork(peerId, siteId, userName);
    const initialData = JSON.stringify({
      type: 'syncResponse',
      siteId: this.controller.siteId,
      peerId: this.peer.id,
      userName: this.controller.userName,
      initialStruct: this.controller.crdt.struct,
      initialVersions: this.controller.vector.versions,
      network: this.controller.network
    });
    if (connBack.open) {
      connBack.send(initialData);
    } else {
      connBack.on('open', () => {
        connBack.send(initialData);
      });
    }
  }
  onConnection(connection) {
    this.controller.updateRootUrl(connection.peer);
    this.addToInConns(connection);
  }
  onData(connection) {
    connection.on('data', data => {
      const dataObj = JSON.parse(data);
      switch (dataObj.type) {
        case 'connRequest':
          this.evaluateRequest(dataObj.peerId, dataObj.siteId, dataObj.userName);
          break;
        case 'syncResponse':
          this.processOutgoingBuffer(dataObj.peerId);
          this.controller.handleSync(dataObj);
          break;
        case 'syncCompleted':
          this.processOutgoingBuffer(dataObj.peerId);
          break;
        case 'add to network':
          this.controller.addToNetwork(dataObj.newPeer, dataObj.newSite, dataObj.newUsername);
          break;
        case 'remove from network':
          this.controller.removeFromNetwork(dataObj.oldPeer);
          break;
        default:
          this.controller.handleRemoteOperation(dataObj);
      }
    });
  }
  randomId() {
    const possConns = this.inConns.filter(conn => {
      return this.peer.id !== conn.peer;
    });
    const randomIdx = Math.floor(Math.random() * possConns.length);
    if (possConns[randomIdx]) {
      return possConns[randomIdx].peer;
    } else {
      return false;
    }
  }
  onConnClose(connection) {
    connection.on('close', () => {
      this.removeFromConnections(connection.peer);
      if (connection.peer === this.controller.urlId) {
        const id = this.randomId();
        if (id) {
          this.controller.updatePageURL(id);
        }
      }
      if (!this.hasReachedMax()) {
        this.controller.findNewTarget();
      }
    });
  }
}
var _default = exports.default = Broadcast;