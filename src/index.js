import React, { useState, useRef } from 'react';
import { render } from "react-dom";
import P2PEditor from './lib';
import CSS_COLORS from './lib/cssColors';
import { generateItemFromHash } from './lib/hashAlgo';
import './style.css'

const App = () => {
  const [content, setContent] = useState('');

  const [userName, setUsername] = useState('');
  const [userNameSubmitted, setUsernameSubmitted] = useState(false);
  const [peers, setPeers] = useState([]);
  const [sharingLink, setSharingLink] = useState('');

  const [showCopyStatus, setShowCopyStatus] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const nameInputRef = useRef(null);
  const nameButtonRef = useRef(null);

  const copyToClipboard = () => {
    const temp = document.createElement("input");
    document.querySelector("body")?.appendChild(temp);
    temp.value = sharingLink;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    setShowCopyStatus(true);
    document.querySelector('.copy-status')?.classList.add('copied');
    setTimeout(() => {
      setShowCopyStatus(false);
      document.querySelector('.copy-status')?.classList.remove('copied')
    }, 1000);
  };

  const submitUsernameOnEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nameButtonRef.current?.click();
    }
  };

  return (
    <div id="body">
      {!userNameSubmitted && (
        <div id="name-container">
          <input
            id='name-input'
            name='handle'
            ref={nameInputRef}
            placeholder='Display name'
            onKeyDown={submitUsernameOnEnter}
          />
          <button
            id='name-button'
            ref={nameButtonRef}
            onClick={() => {
              const inputUsername = nameInputRef.current?.value.trim();
              if (inputUsername) {
                setUsername(inputUsername);
                setUsernameSubmitted(true);
              }
              else {
                setShowNameError(true);
                setTimeout(() => setShowNameError(false), 2000);
              }
            }}>
            Submit
          </button>
          {showNameError && <span id="name-error" className="hidden">Display name cannot be empty!</span>}
        </div>
      )}
      {userNameSubmitted && (
        <>
        <div id="header">
          <div id="peers"> 
            {
              peers.map(peer => (
                <div
                  className='peer'
                  key={peer.id}
                  style={{
                    // color: generateItemFromHash(peer.id, CSS_COLORS),
                    borderColor: generateItemFromHash(peer.id, CSS_COLORS),
                  }}
                >
                  <span className="online-dot" />
                  {peer.name}
                </div>
              ))
            }
          </div>
          {showCopyStatus && <span className="copy-status">Copied!</span>}
          <button className="link" id="share-button" onClick={copyToClipboard}>
            Copy Sharing Link
          </button>
        </div>
        <P2PEditor
          peerOptions={{
            debug: 3,
          }}
          initialContent={'# Hello World!!!'}
          onChange={setContent}
          userName={userName}
          setPeers={setPeers}
          setSharingLink={setSharingLink}
          style={{height: '500px'}}
        />
        </>
      )}
    </div>
  );
}

render(<App />, document.getElementById("root"));