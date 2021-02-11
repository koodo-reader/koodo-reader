import localforage from "localforage";
import NoteModel from "../../model/Note";
import BookmarkModel from "../../model/Bookmark";
import AddTrash from "../../utils/readUtils/addTrash";
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

export function handleCurrentChapter(currentChapter: string) {
  return { type: "HANDLE_CURRENT_CHAPTER", payload: currentChapter };
}
export function handleChapters(chapters: any) {
  return { type: "HANDLE_CHAPTERS", payload: chapters };
}
export function handleFlattenChapters(flattenChapters: any) {
  return { type: "HANDLE_FLATTEN_CHAPTERS", payload: flattenChapters };
}
export function handleNoteKey(key: string) {
  return { type: "HANDLE_NOTE_KEY", payload: key };
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
      let keyArr = AddTrash.getAllTrash();
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
export function flatChapter(chapters: any) {
  let newChapter: any = [];
  for (let i = 0; i < chapters.length; i++) {
    if (chapters[i].subitems[0]) {
      newChapter.push(chapters[i]);
      newChapter = newChapter.concat(flatChapter(chapters[i].subitems));
    } else {
      newChapter.push(chapters[i]);
    }
  }
  return newChapter;
}

export function handleFetchChapters(epub: any) {
  return (dispatch: (arg0: { type: string; payload: any }) => void) => {
    epub.loaded.navigation
      .then((chapters: any) => {
        dispatch(handleChapters(chapters.toc));
        dispatch(handleFlattenChapters(flatChapter(chapters.toc)));
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
      let keyArr = AddTrash.getAllTrash();
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
