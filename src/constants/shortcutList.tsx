import { ShortcutAction } from "../utils/reader/shortcutUtil";

export type ShortcutListItem = {
  action: ShortcutAction;
  title: string;
  desc: string;
  isElectron?: boolean;
};

export const shortcutList: ShortcutListItem[] = [
  {
    action: "nextPage",
    title: "Next page",
    desc: "Go to the next page while reading",
  },
  {
    action: "prevPage",
    title: "Previous page",
    desc: "Go to the previous page while reading",
  },
  {
    action: "bossKey",
    title: "Hide reader (Boss key)",
    desc: "Quickly hide the reader window",
    isElectron: true,
  },
  {
    action: "toggleFishMode",
    title: "Toggle fish mode",
    desc: "Switch between fish mode and normal mode",
    isElectron: true,
  },
  {
    action: "toggleFullscreen",
    title: "Toggle fullscreen",
    desc: "Enter or exit fullscreen mode",
  },
  {
    action: "exitReader",
    title: "Exit reader",
    desc: "Close the reader or exit fullscreen",
  },
  {
    action: "searchInBook",
    title: "Search in book",
    desc: "Open the in-book search panel",
  },
  {
    action: "openToc",
    title: "Open table of contents",
    desc: "Open the navigation panel",
  },
  {
    action: "openLeftPanel",
    title: "Open left reading panel",
    desc: "Open or close the left reading panel",
  },
  {
    action: "openRightPanel",
    title: "Open right reading panel",
    desc: "Open or close the right reading panel",
  },
  {
    action: "openTopPanel",
    title: "Open top reading panel",
    desc: "Open or close the top reading panel",
  },
  {
    action: "openBottomPanel",
    title: "Open bottom reading panel",
    desc: "Open or close the bottom reading panel",
  },
  {
    action: "selectionTranslate",
    title: "Translate selection",
    desc: "Translate the currently selected text",
  },
  {
    action: "selectionDict",
    title: "Dictionary lookup",
    desc: "Look up the selected text in dictionary",
  },
  {
    action: "selectionNote",
    title: "Take note on selection",
    desc: "Create a note for the selected text",
  },
  {
    action: "selectionHighlight",
    title: "Highlight selection",
    desc: "Highlight the selected text",
  },
  {
    action: "selectionSpeak",
    title: "Speak selection",
    desc: "Read the selected text aloud",
  },
  {
    action: "searchSelectedInBook",
    title: "Search selection in book",
    desc: "Search the book using the selected text",
  },
];
