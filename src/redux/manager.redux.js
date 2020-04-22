import localforage from "localforage";
import OtherUtil from "../utils/otherUtil";
const initState = {
  books: null,
  epubs: null,
  covers: null,
  searchBooks: [],
  isSearch: false,
  isSort: true,
  isList: "card",
  isSortDisplay: false,
  sortCode: { sort: 2, order: 2 },
  isMessage: false,
  message: "添加成功"
};
export function manager(state = initState, action) {
  switch (action.type) {
    case "HANDLE_BOOKS":
      return {
        ...state,
        books: action.payload
      };
    case "HANDLE_SEARCH_BOOKS":
      return {
        ...state,
        searchBooks: action.payload
      };
    case "HANDLE_SEARCH":
      return {
        ...state,
        isSearch: action.payload
      };
    case "HANDLE_SORT":
      return {
        ...state,
        isSort: action.payload
      };
    case "HANDLE_LIST":
      return {
        ...state,
        isList: action.payload
      };
    case "HANDLE_SORT_DISPLAY":
      return {
        ...state,
        isSortDisplay: action.payload
      };
    case "HANDLE_MESSAGE":
      return {
        ...state,
        message: action.payload
      };
    case "HANDLE_MESSAGE_BOX":
      return {
        ...state,
        isMessage: action.payload
      };
    case "HANDLE_SORT_CODE":
      return {
        ...state,
        sortCode: { sort: action.payload.sort, order: action.payload.order }
      };
    case "HANDLE_NOTES":
      return {
        ...state,
        notes: action.payload
      };
    case "HANDLE_BOOKMARKS":
      return {
        ...state,
        bookmarks: action.payload
      };
    case "HANDLE_EPUBS":
      return {
        ...state,
        epubs: action.payload
      };
    case "HANDLE_COVERS":
      return {
        ...state,
        covers: action.payload
      };

    default:
      return state;
  }
}
export function handleNotes(notes) {
  return { type: "HANDLE_NOTES", payload: notes };
}
export function handleBooks(books) {
  return { type: "HANDLE_BOOKS", payload: books };
}
export function handleSearchBooks(searchBooks) {
  return { type: "HANDLE_SEARCH_BOOKS", payload: searchBooks };
}
export function handleSearch(mode) {
  return { type: "HANDLE_SEARCH", payload: mode };
}
export function handleSort(mode) {
  return { type: "HANDLE_SORT", payload: mode };
}
export function handleList(mode) {
  return { type: "HANDLE_LIST", payload: mode };
}
export function handleMessage(message) {
  // console.log(message);
  return { type: "HANDLE_MESSAGE", payload: message };
}
export function handleMessageBox(mode) {
  // console.log(mode);
  return { type: "HANDLE_MESSAGE_BOX", payload: mode };
}
export function handleSortDisplay(mode) {
  // console.log("hdflhghgh", mode);
  return { type: "HANDLE_SORT_DISPLAY", payload: mode };
}
export function handleSortCode(code) {
  // console.log(code);
  return { type: "HANDLE_SORT_CODE", payload: code };
}
export function handleEpubs(epubs) {
  return { type: "HANDLE_EPUBS", payload: epubs };
}
export function handleCovers(covers) {
  return { type: "HANDLE_COVERS", payload: covers };
}
export function handleBookmarks(bookmarks) {
  return { type: "HANDLE_COVERS", payload: bookmarks };
}
export function handleFetchBooks() {
  return dispatch => {
    localforage.getItem("books", (err, value) => {
      let bookArr = value;
      dispatch(handleBooks(bookArr));
      let epubArr = [];
      if (bookArr === null) {
        epubArr = null;
      } else {
        bookArr.forEach(item => {
          // console.log(item, "sgash");

          let epub = window.ePub({
            bookPath: item.content,
            restore: false
          });
          // console.log(epub, "eashah");
          epubArr.push(epub);
          dispatch(handleEpubs(epubArr));
          let coverArr = [];
          // async function getCovers(epubArr) {
          epubArr.forEach(async (item, index) => {
            await item
              .coverUrl()
              .then((url) => {
                // console.log(url, "urlsagasf");
                coverArr.push({ key: bookArr[index].key, url: url });
                if (coverArr.length === bookArr.length) {
                  // console.log(coverArr, "coverArr");
                  dispatch(handleCovers(coverArr));
                }
              })
              .catch((err) => {
                console.log("Error occurs");
              });;
          });
        });
      }
    });
  };
}
export function handleFetchSortCode() {
  return dispatch => {
    let sortCode = OtherUtil.getSortCode();
    dispatch(handleSortCode(sortCode));
  };
}
export function handleFetchList() {
  return dispatch => {
    let isList = localStorage.getItem("isList") || "card";
    dispatch(handleList(isList));
  };
}
