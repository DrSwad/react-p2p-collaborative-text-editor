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
function initialize() {
  let peerOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    debug: 3
  };
  let textAreaRef = arguments.length > 1 ? arguments[1] : undefined;
  let placeholder = arguments.length > 2 ? arguments[2] : undefined;
  let initialContent = arguments.length > 3 ? arguments[3] : undefined;
  let userName = arguments.length > 4 ? arguments[4] : undefined;
  let callbacks = arguments.length > 5 ? arguments[5] : undefined;
  let document = arguments.length > 6 ? arguments[6] : undefined;
  let window = arguments.length > 7 ? arguments[7] : undefined;
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
  const controller = new _controller.default(targetPeerId, href, userName, new _peerjs.default(peerOptions), new _broadcast.default(), editor, document, window, callbacks);
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