import React, { useState } from 'react';
import { render } from "react-dom";
import P2PEditor from './lib';
import CSS_COLORS from './lib/cssColors';
import { generateItemFromHash } from './lib/hashAlgo';
import './style.css'

const App = () => {
  const [userName, setUsername] = useState('');
  const [userNameSubmitted, setUsernameSubmitted] = useState(false);
  const [peers, setPeers] = useState([]);
  const [sharingLink, setSharingLink] = useState('');

  const copyToClipboard = () => {
    const temp = document.createElement("input");
    document.querySelector("body").appendChild(temp);
    temp.value = sharingLink;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    document.querySelector('.copy-status').classList.add('copied');
    setTimeout(() => document.querySelector('.copy-status').classList.remove('copied'), 1000);
  };

  const submitUsernameOnEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById('name-button').click();
    }
  };

  return (
    <div id="body">
      {!userNameSubmitted && (
        <div id="name-container">
          <input id='name-input' name='handle' placeholder='Display name' onKeyDown={submitUsernameOnEnter} />
          <button id='name-button' onClick={() => {
            const inputUsername = document.getElementById('name-input').value.trim();
            if (inputUsername) {
              setUsername(inputUsername);
              setUsernameSubmitted(true);
            }
            else {
              document.getElementById('name-error').classList.remove('hidden');
              setTimeout(() => document.getElementById('name-error')?.classList?.add('hidden'), 2000);
            }
          }}>Submit</button>
          <span id="name-error" class="hidden">Display name cannot be empty!</span>
        </div>
      )}
      {userNameSubmitted && (
        <>
        <div id="header">
          <div id="peers"> 
            {
              peers.map(peer => (
                <div
                  class='peer'
                  key={peer.id}
                  style={{
                    // color: generateItemFromHash(peer.id, CSS_COLORS),
                    borderColor: generateItemFromHash(peer.id, CSS_COLORS),
                  }}
                >
                  <span class="online-dot" />
                  {peer.name}
                </div>
              ))
            }
          </div>
          <span class="copy-status">Copied!</span>
          <button class="link" id="share-button" onClick={copyToClipboard}>
            Copy Sharing Link
          </button>
        </div>
        <P2PEditor
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