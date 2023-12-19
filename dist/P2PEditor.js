"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _main = _interopRequireDefault(require("./main"));
require("./P2PEditor.css");
const P2PEditor = _ref => {
  let {
    peerOptions = {},
    placeholder = 'Share the link to invite collaborators to your document.',
    initialContent = '',
    onChange = content => {},
    userName = 'Unnamed User',
    setPeers = peers => {},
    setSharingLink = sharingLink => {},
    style = {}
  } = _ref;
  const initialized = (0, _react.useRef)(false);
  (0, _react.useEffect)(() => {
    if (!initialized.current) {
      initialized.current = true;
      (0, _main.default)(peerOptions, textAreaRef, placeholder, initialContent, userName, {
        setPeers,
        setSharingLink,
        onChange
      }, document, window);
    }
  }, [peerOptions, placeholder, initialContent, userName, onChange, setPeers, setSharingLink]);
  const textAreaRef = (0, _react.useRef)(null);
  return /*#__PURE__*/_react.default.createElement("div", {
    id: "CodeMirrorWrapper",
    style: style
  }, /*#__PURE__*/_react.default.createElement("textarea", {
    ref: textAreaRef
  }));
};
var _default = exports.default = P2PEditor;