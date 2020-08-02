import localforage from "localforage";
import NoteModel from "../../model/Note";
import DigestModel from "../../model/Digest";
import BookmarkModel from "../../model/Bookmark";
export function handleNotes(notes: NoteModel[]) {
  return { type: "HANDLE_NOTES", payload: notes };
}
export function handleColor(color: number) {
  return { type: "HANDLE_COLOR", payload: color };
}
export function handleBookmarks(bookmarks: BookmarkModel[]) {
  return { type: "HANDLE_BOOKMARKS", payload: bookmarks };
}
export function handleDigests(digests: DigestModel[]) {
  return { type: "HANDLE_DIGESTS", payload: digests };
}
export function handleLocations(locations: any) {
  return { type: "HANDLE_LOCATIONS", payload: locations };
}
export function handleSingle(mode: string) {
  return { type: "HANDLE_SINGLE", payload: mode };
}
export function handleChapters(chapters: any) {
  return { type: "HANDLE_CHAPTERS", payload: chapters };
}

export function handleFetchNotes() {
  return (dispatch: (arg0: { type: string; payload: NoteModel[] }) => void) => {
    localforage.getItem("notes", (err, value) => {
      let noteArr: any;
      if (value === null || value === []) {
        noteArr = [];
      } else {
        noteArr = value;
      }
      dispatch(handleNotes(noteArr));
    });
  };
}

export function handleFetchChapters(epub: any) {
  return (dispatch: (arg0: { type: string; payload: any }) => void) => {
    epub
      .getToc()
      .then((chapters: any) => {
        dispatch(handleChapters(chapters));
      })
      .catch(() => {
        console.log("Error occurs");
      });
  };
}
export function handleFetchBookmarks() {
  return (
    dispatch: (arg0: { type: string; payload: BookmarkModel[] }) => void
  ) => {
    localforage.getItem("bookmarks", (err, value) => {
      let bookmarkArr: any;
      if (value === null || value === []) {
        bookmarkArr = [];
      } else {
        bookmarkArr = value;
      }
      dispatch(handleBookmarks(bookmarkArr));
    });
  };
}
export function handleFetchDigests() {
  return (
    dispatch: (arg0: { type: string; payload: DigestModel[] }) => void
  ) => {
    localforage.getItem("digests", (err, value) => {
      let digestArr: any;
      if (value === null || value === []) {
        digestArr = [];
      } else {
        digestArr = value;
      }
      dispatch(handleDigests(digestArr));
    });
  };
}
