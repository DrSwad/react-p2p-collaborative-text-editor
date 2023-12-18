"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initialize;
var _peerjs = _interopRequireDefault(require("peerjs"));
var _simplemdeW = _interopRequireDefault(require("simplemde-w"));
require("simplemde-w/dist/simplemde.min.css");
var _controller = _interopRequireDefault(require("./controller"));
var _broadcast = _interopRequireDefault(require("./broadcast"));
var _editor = _interopRequireDefault(require("./editor"));
function initialize(textAreaRef, placeholder, initialContent, userName, callbacks, document, window) {
  const editor = new _editor.default(new _simplemdeW.default({
    element: textAreaRef.current,
    placeholder: placeholder,
    spellChecker: true,
    toolbar: false,
    autofocus: false,
    indentWithTabs: true,
    tabSize: 4,
    indentUnit: 4,
    lineWrapping: true,
    shortCuts: []
  }), document);
  const targetPeerId = window.location.search.slice(1) || '0';
  const href = window.location.protocol + '//' + window.location.host + window.location.pathname;
  console.log(href);
  const controller = new _controller.default(targetPeerId, href, userName, new _peerjs.default({
    debug: 3
  }), new _broadcast.default(), editor, document, window, callbacks);
  const getText = () => {
    return editor.mde.value();
  };
  const setText = text => {
    controller.localInsert(text, {
      line: 0,
      ch: 0
    });
    editor.replaceText(controller.crdt.toText());
  };
  if (initialContent && targetPeerId === '0') {
    setText(initialContent);
    callbacks.onChange(initialContent);
  } else {
    callbacks.onChange(getText());
  }
  return {
    getText,
    setText
  };
}