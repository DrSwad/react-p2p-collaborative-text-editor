import Peer from 'peerjs';
import SimpleMDE from 'simplemde-w';
import "simplemde-w/dist/simplemde.min.css";

import Controller from './controller';
import Broadcast from './broadcast';
import Editor from './editor';

export default function initialize(
  textAreaRef,
  userName,
  callbacks,
  document,
  window,
) {
  const editor = new Editor(
    new SimpleMDE({
      element: textAreaRef.current,
      placeholder: "Share the link to invite collaborators to your document.",
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

  const controller = new Controller(
    (window.location.search.slice(1) || '0'),
    window.location.origin,
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

  return { getText, setText };
}