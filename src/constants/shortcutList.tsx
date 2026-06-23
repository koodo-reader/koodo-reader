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
