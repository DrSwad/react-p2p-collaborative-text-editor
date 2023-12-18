import React, { useEffect, useRef } from "react";
import initialize from "./main";
import "./P2PEditor.css"

const P2PEditor = ({
  userName = 'Unnamed User',
  setPeers = (peers) => {},
  setSharingLink = (sharingLink) => {},
  style = {},
}) => {
  useEffect(() => {
    initialize(
      textAreaRef,
      userName,
      { setPeers, setSharingLink },
      document,
      window,
    );
  }, [userName, setPeers, setSharingLink]);

  const textAreaRef = useRef(null)

  return (
    <div id="CodeMirrorWrapper" style={style}>
      <textarea ref={textAreaRef} />
    </div>
  );
  }

export default P2PEditor;