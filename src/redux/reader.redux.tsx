import localforage from "localforage";
const initState = {
  bookmarks: null,
  notes: null,
  digests: null,
  locations: null,
  chapters: null,
  highlighters: null,
  isSingle: localStorage.getItem("isSingle") || "double",
};
export function reader(state = initState, action) {
  switch (action.type) {
    case "HANDLE_BOOKMARKS":
      return {
        ...state,
        bookmarks: action.payload,
      };
    case "HANDLE_NOTES":
      return {
        ...state,
        notes: action.payload,
      };
    case "HANDLE_DIGESTS":
      return {
        ...state,
        digests: action.payload,
      };
    case "HANDLE_LOCATIONS":
      return {
        ...state,
        locations: action.payload,
      };
    case "HANDLE_SECTION":
      return {
        ...state,
        section: action.payload,
      };
    case "HANDLE_SINGLE":
      return {
        ...state,
        isSingle: action.payload,
      };
    case "HANDLE_CHAPTERS":
      return {
        ...state,
        chapters: action.payload,
      };
    case "HANDLE_HIGHLIGHTERS":
      return {
        ...state,
        highlighters: action.payload,
      };
    default:
      return state;
  }
}
export function handleNotes(notes) {
  return { type: "HANDLE_NOTES", payload: notes };
}
export function handleBookmarks(bookmarks) {
  return { type: "HANDLE_BOOKMARKS", payload: bookmarks };
}
export function handleDigests(digests) {
  return { type: "HANDLE_DIGESTS", payload: digests };
}
export function handleLocations(locations) {
  return { type: "HANDLE_LOCATIONS", payload: locations };
}
export function handleSection(section) {
  return { type: "HANDLE_SECTION", payload: section };
}
export function handleSingle(mode) {
  return { type: "HANDLE_SINGLE", payload: mode };
}
export function handleChapters(chapters) {
  return { type: "HANDLE_CHAPTERS", payload: chapters };
}
export function handleHighlighters(highlighters) {
  return { type: "HANDLE_HIGHLIGHTERS", payload: highlighters };
}
export function handleFetchNotes() {
  return (dispatch) => {
    localforage.getItem("notes", (err, value) => {
      let noteArr;
      if (value === null || value === []) {
        noteArr = null;
      } else {
        noteArr = value;
      }
      dispatch(handleNotes(noteArr));
    });
  };
}

export function handleFetchChapters(epub) {
  return (dispatch) => {
    epub
      .getToc()
      .then((chapters) => {
        dispatch(handleChapters(chapters));
      })
      .catch(() => {
        console.log("Error occurs");
      });
  };
}
export function handleFetchBookmarks() {
  return (dispatch) => {
    localforage.getItem("bookmarks", (err, value) => {
      let bookmarkArr;
      if (value === null || value === []) {
        bookmarkArr = null;
      } else {
        bookmarkArr = value;
      }
      // console.log(value, "dgaskgskgr");
      dispatch(handleBookmarks(bookmarkArr));
    });
  };
}
export function handleFetchDigests() {
  return (dispatch) => {
    localforage.getItem("digests", (err, value) => {
      let digestArr;
      if (value === null || value === []) {
        digestArr = null;
      } else {
        digestArr = value;
      }
      dispatch(handleDigests(digestArr));
    });
  };
}
export function handleFetchHighlighters() {
  return (dispatch) => {
    localforage.getItem("highlighters", (err, value) => {
      let highlighterArr;
      if (value === null || value === []) {
        highlighterArr = null;
      } else {
        highlighterArr = value;
      }
      dispatch(handleHighlighters(highlighterArr));
    });
  };
}
