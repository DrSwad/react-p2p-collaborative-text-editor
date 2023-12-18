import React, { useEffect, useRef } from "react";
import initialize from "./main";
import "./P2PEditor.css"

const P2PEditor = ({
  placeholder =  'Share the link to invite collaborators to your document.',
  initialContent = '',
  onChange = (content) => {},
  userName = 'Unnamed User',
  setPeers = (peers) => {},
  setSharingLink = (sharingLink) => {},
  style = {},
}) => {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initialize(
        textAreaRef,
        placeholder,
        initialContent,
        userName,
        { setPeers, setSharingLink, onChange },
        document,
        window,
      );
    }
  }, [placeholder, initialContent, userName, onChange, setPeers, setSharingLink]);

  const textAreaRef = useRef(null)

  return (
    <div id="CodeMirrorWrapper" style={style}>
      <textarea ref={textAreaRef} />
    </div>
  );
  }

export default P2PEditor;