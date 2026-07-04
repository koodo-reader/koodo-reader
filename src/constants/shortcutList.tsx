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
    action: "prevChapter",
    title: "Previous chapter",
    desc: "Go to the previous chapter while reading",
  },
  {
    action: "nextChapter",
    title: "Next chapter",
    desc: "Go to the next chapter while reading",
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
    action: "createBookmark",
    title: "Create bookmark",
    desc: "Add a bookmark at the current reading position",
  },
  {
    action: "openBookmarkList",
    title: "Toggle bookmark list",
    desc: "Open or close the bookmark list in the left reading panel",
  },
  {
    action: "openNoteList",
    title: "Toggle note list",
    desc: "Open or close the note list in the left reading panel",
  },
  {
    action: "openHighlightList",
    title: "Toggle highlight list",
    desc: "Open or close the highlight list in the left reading panel",
  },
  {
    action: "openToc",
    title: "Toggle table of contents",
    desc: "Open or close table of contents in the left reading panel",
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
    action: "selectionSearch",
    title: "Search selection in book",
    desc: "Search the book using the selected text",
  },
];
