"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _crdt = _interopRequireDefault(require("./crdt"));
var _char = _interopRequireDefault(require("./char"));
var _identifier = _interopRequireDefault(require("./identifier"));
var _versionVector = _interopRequireDefault(require("./versionVector"));
var _version = _interopRequireDefault(require("./version"));
var _uuid = require("uuid");
class Controller {
  constructor(targetPeerId, host, userName, peer, broadcast, editor, document, window, callbacks) {
    this.siteId = (0, _uuid.v1)();
    this.host = host;
    this.userName = userName;
    this.buffer = [];
    this.calling = [];
    this.network = [];
    this.urlId = targetPeerId;
    this.document = document;
    this.window = window;
    this.callbacks = callbacks;
    if (targetPeerId === 0) this.enableEditor();
    this.broadcast = broadcast;
    this.broadcast.controller = this;
    this.broadcast.bindServerEvents(targetPeerId, peer);
    this.editor = editor;
    this.editor.controller = this;
    this.editor.bindChangeEvent();
    this.vector = new _versionVector.default(this.siteId);
    this.crdt = new _crdt.default(this);
  }
  setPeers() {
    const peers = this.network.map(peerObj => ({
      id: peerObj.siteId,
      name: peerObj.userName
    }));
    this.callbacks.setPeers(peers);
  }
  lostConnection() {
    console.log('disconnected');
  }
  updateShareLink(id) {
    const shareLink = this.host + '?' + id;
    this.callbacks.setSharingLink(shareLink);
  }
  updatePageURL(id) {
    this.urlId = id;
    const newURL = this.host + '?' + id;
    this.window.history.pushState({}, '', newURL);
  }
  updateRootUrl(id) {
    if (this.urlId === 0) {
      this.updatePageURL(id, this.window);
    }
  }
  enableEditor() {
    // this.document.getElementById('editor').classList.remove('hide');
  }
  populateCRDT(initialStruct) {
    const struct = initialStruct.map(line => {
      return line.map(ch => {
        return new _char.default(ch.value, ch.counter, ch.siteId, ch.position.map(id => {
          return new _identifier.default(id.digit, id.siteId);
        }));
      });
    });
    this.crdt.struct = struct;
    this.editor.replaceText(this.crdt.toText());
  }
  populateVersionVector(initialVersions) {
    const versions = initialVersions.map(ver => {
      let version = new _version.default(ver.siteId);
      version.counter = ver.counter;
      ver.exceptions.forEach(ex => version.exceptions.push(ex));
      return version;
    });
    versions.forEach(version => this.vector.versions.push(version));
  }
  addToNetwork(peerId, siteId, userName) {
    if (!this.network.find(obj => obj.siteId === siteId)) {
      this.network.push({
        peerId,
        siteId,
        userName
      });
      this.setPeers();
      this.broadcast.addToNetwork(peerId, siteId, userName);
    }
  }
  removeFromNetwork(peerId) {
    const peerObj = this.network.find(obj => obj.peerId === peerId);
    const idx = this.network.indexOf(peerObj);
    if (idx >= 0) {
      const deletedObj = this.network.splice(idx, 1)[0];
      this.setPeers();
      this.editor.removeCursor(deletedObj.siteId);
      this.broadcast.removeFromNetwork(peerId);
    }
  }
  findNewTarget() {
    const connected = this.broadcast.outConns.map(conn => conn.peer);
    const unconnected = this.network.filter(obj => {
      return connected.indexOf(obj.peerId) === -1;
    });
    const possibleTargets = unconnected.filter(obj => {
      return obj.peerId !== this.broadcast.peer.id;
    });
    if (possibleTargets.length === 0) {
      this.broadcast.peer.on('connection', conn => this.updatePageURL(conn.peer));
    } else {
      const randomIdx = Math.floor(Math.random() * possibleTargets.length);
      const newTarget = possibleTargets[randomIdx].peerId;
      this.broadcast.requestConnection(newTarget, this.broadcast.peer.id, this.siteId);
    }
  }
  handleSync(syncObj) {
    if (syncObj.peerId !== this.urlId) {
      this.updatePageURL(syncObj.peerId);
    }
    syncObj.network.forEach(obj => this.addToNetwork(obj.peerId, obj.siteId, obj.userName));
    if (this.crdt.totalChars() === 0) {
      this.populateCRDT(syncObj.initialStruct);
      this.populateVersionVector(syncObj.initialVersions);
    }
    this.enableEditor();
    this.syncCompleted(syncObj.peerId);
  }
  syncCompleted(peerId) {
    const completedMessage = JSON.stringify({
      type: 'syncCompleted',
      peerId: this.broadcast.peer.id
    });
    let connection = this.broadcast.outConns.find(conn => conn.peer === peerId);
    if (connection) {
      connection.send(completedMessage);
    } else {
      connection = this.broadcast.peer.connect(peerId);
      this.broadcast.addToOutConns(connection);
      connection.on('open', () => {
        connection.send(completedMessage);
      });
    }
  }
  handleRemoteOperation(operation) {
    if (this.vector.hasBeenApplied(operation.version)) return;
    if (operation.type === 'insert') {
      this.applyOperation(operation);
    } else if (operation.type === 'delete') {
      this.buffer.push(operation);
    }
    this.processDeletionBuffer();
    this.broadcast.send(operation);
  }
  processDeletionBuffer() {
    let i = 0;
    let deleteOperation;
    while (i < this.buffer.length) {
      deleteOperation = this.buffer[i];
      if (this.hasInsertionBeenApplied(deleteOperation)) {
        this.applyOperation(deleteOperation);
        this.buffer.splice(i, 1);
      } else {
        i++;
      }
    }
  }
  hasInsertionBeenApplied(operation) {
    const charVersion = {
      siteId: operation.char.siteId,
      counter: operation.char.counter
    };
    return this.vector.hasBeenApplied(charVersion);
  }
  applyOperation(operation) {
    const char = operation.char;
    const identifiers = char.position.map(pos => new _identifier.default(pos.digit, pos.siteId));
    const newChar = new _char.default(char.value, char.counter, char.siteId, identifiers);
    if (operation.type === 'insert') {
      this.crdt.handleRemoteInsert(newChar);
    } else if (operation.type === 'delete') {
      this.crdt.handleRemoteDelete(newChar, operation.version.siteId);
    }
    this.vector.update(operation.version);
  }
  localDelete(startPos, endPos) {
    this.crdt.handleLocalDelete(startPos, endPos);
  }
  localInsert(chars, startPos) {
    for (let i = 0; i < chars.length; i++) {
      if (chars[i - 1] === '\n') {
        startPos.line++;
        startPos.ch = 0;
      }
      this.crdt.handleLocalInsert(chars[i], startPos);
      startPos.ch++;
    }
  }
  broadcastInsertion(char) {
    const operation = {
      type: 'insert',
      char: char,
      version: this.vector.getLocalVersion()
    };
    this.broadcast.send(operation);
  }
  broadcastDeletion(char, version) {
    const operation = {
      type: 'delete',
      char: char,
      version: version
    };
    this.broadcast.send(operation);
  }
  insertIntoEditor(value, pos, siteId) {
    const positions = {
      from: {
        line: pos.line,
        ch: pos.ch
      },
      to: {
        line: pos.line,
        ch: pos.ch
      }
    };
    this.editor.insertText(value, positions, siteId);
  }
  deleteFromEditor(value, pos, siteId) {
    let positions;
    if (value === "\n") {
      positions = {
        from: {
          line: pos.line,
          ch: pos.ch
        },
        to: {
          line: pos.line + 1,
          ch: 0
        }
      };
    } else {
      positions = {
        from: {
          line: pos.line,
          ch: pos.ch
        },
        to: {
          line: pos.line,
          ch: pos.ch + 1
        }
      };
    }
    this.editor.deleteText(value, positions, siteId);
  }
}
var _default = exports.default = Controller;