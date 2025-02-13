import NoteModel from "../../models/Note";
import BookmarkModel from "../../models/Bookmark";
import HtmlBookModel from "../../models/HtmlBook";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../utils/storage/databaseService";

export function handleNotes(notes: NoteModel[]) {
  return { type: "HANDLE_NOTES", payload: notes };
}
export function handleOriginalText(originalText: string) {
  return { type: "HANDLE_ORIGINAL_TEXT", payload: originalText };
}
export function handleColor(color: number) {
  return { type: "HANDLE_COLOR", payload: color };
}
export function handleBookmarks(bookmarks: BookmarkModel[]) {
  return { type: "HANDLE_BOOKMARKS", payload: bookmarks };
}
export function handleDigests(digests: NoteModel[]) {
  return { type: "HANDLE_DIGESTS", payload: digests };
}
export function handleHtmlBook(htmlBook: HtmlBookModel) {
  return { type: "HANDLE_HTML_BOOK", payload: htmlBook };
}
export function handleCurrentChapter(currentChapter: string) {
  return { type: "HANDLE_CURRENT_CHAPTER", payload: currentChapter };
}
export function handleCurrentChapterIndex(currentChapterIndex: number) {
  return { type: "HANDLE_CURRENT_CHAPTER_INDEX", payload: currentChapterIndex };
}
export function handleChapters(chapters: any) {
  return { type: "HANDLE_CHAPTERS", payload: chapters };
}
export function handleNoteKey(key: string) {
  return { type: "HANDLE_NOTE_KEY", payload: key };
}
export function handleReaderMode(readerMode: string) {
  return { type: "HANDLE_READER_MODE", payload: readerMode };
}
export function handleNavLock(isNavLocked: boolean) {
  return { type: "HANDLE_NAV_LOCK", payload: isNavLocked };
}
export function handleFetchNotes() {
  return (dispatch: (arg0: { type: string; payload: NoteModel[] }) => void) => {
    DatabaseService.getAllRecords("notes").then((value) => {
      let noteArr: any;
      if (value === null) {
        noteArr = [];
      } else {
        noteArr = value;
      }
      let keyArr = ConfigService.getAllListConfig("deletedBooks");
      dispatch(handleNotes(handleKeyRemove(noteArr, keyArr)));
      dispatch(
        handleDigests(
          handleKeyRemove(
            noteArr.filter((item: NoteModel) => {
              return item.notes === "";
            }),
            keyArr
          )
        )
      );
    });
  };
}

export function handleFetchBookmarks() {
  return (
    dispatch: (arg0: { type: string; payload: BookmarkModel[] }) => void
  ) => {
    DatabaseService.getAllRecords("bookmarks").then((value) => {
      let bookmarkArr: any;
      if (value === null) {
        bookmarkArr = [];
      } else {
        bookmarkArr = value;
      }
      let keyArr = ConfigService.getAllListConfig("deletedBooks");
      dispatch(handleBookmarks(handleKeyRemove(bookmarkArr, keyArr)));
    });
  };
}
const handleKeyRemove = (items: any[], arr: string[]) => {
  let itemArr: any[] = [];
  if (!arr[0]) {
    return items;
  }
  for (let i = 0; i < items.length; i++) {
    if (arr.indexOf(items[i].bookKey) === -1) {
      itemArr.push(items[i]);
    }
  }
  return itemArr;
};
