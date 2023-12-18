import Peer from 'peerjs';
import SimpleMDE from 'simplemde-w';
import "simplemde-w/dist/simplemde.min.css";

import Controller from './controller';
import Broadcast from './broadcast';
import Editor from './editor';

export default function initialize(
  textAreaRef,
  placeholder,
  initialContent,
  userName,
  callbacks,
  document,
  window,
) {
  const editor = new Editor(
    new SimpleMDE({
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
    }),
    document
  );

  const targetPeerId = (window.location.search.slice(1) || '0');
  const href = window.location.protocol + '//' + window.location.host + window.location.pathname;
  console.log(href);
  const controller = new Controller(
    targetPeerId,
    href,
    userName,
    new Peer({
        debug: 3
      }),
    new Broadcast(),
    editor,
    document,
    window,
    callbacks
  );

  const getText = () => {
    return editor.mde.value();
  };
  
  const setText = (text) => {
    controller.localInsert(text, { line: 0, ch: 0 });
    editor.replaceText(controller.crdt.toText());
  };

  if (initialContent && targetPeerId === '0') {
    setText(initialContent);
    callbacks.onChange(initialContent);
  }
  else {
    callbacks.onChange(getText());
  }

  return { getText, setText };
}