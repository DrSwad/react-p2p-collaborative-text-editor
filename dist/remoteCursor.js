"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _cssColors = _interopRequireDefault(require("./cssColors"));
var _hashAlgo = require("./hashAlgo");
class RemoteCursor {
  constructor(mde, siteId, username, position, document) {
    this.mde = mde;
    this.document = document;
    const color = (0, _hashAlgo.generateItemFromHash)(siteId, _cssColors.default);
    const name = username;
    this.createCursor(color);
    this.createFlag(color, name);
    this.cursor.appendChild(this.flag);
    this.set(position);
  }
  createCursor(color) {
    const textHeight = this.mde.codemirror.defaultTextHeight();
    this.cursor = this.document.createElement('div');
    this.cursor.classList.add('remote-cursor');
    this.cursor.style.backgroundColor = color;
    this.cursor.style.height = textHeight + 'px';
  }
  createFlag(color, name) {
    const cursorName = this.document.createTextNode(name);
    this.flag = this.document.createElement('span');
    this.flag.classList.add('flag');
    this.flag.style.backgroundColor = color;
    this.flag.appendChild(cursorName);
  }
  set(position) {
    this.detach();
    const coords = this.mde.codemirror.cursorCoords(position, 'local');
    this.cursor.style.left = (coords.left >= 0 ? coords.left : 0) + 'px';
    this.mde.codemirror.getDoc().setBookmark(position, {
      widget: this.cursor
    });
    this.lastPosition = position;

    // Add a zero width-space so line wrapping works (on firefox?)
    this.cursor.parentElement.appendChild(this.document.createTextNode("\u200b"));
  }
  detach() {
    // Used when updating cursor position.
    // If cursor exists on the DOM, remove it.  
    // DO NOT remove cursor's parent. It contains the zero width-space.
    if (this.cursor.parentElement) this.cursor.remove();
  }
}
exports.default = RemoteCursor;