import localforage from "localforage";
import OtherUtil from "../../utils/otherUtil";
import BookModel from "../../model/Book";
import BookmarkModel from "../../model/Bookmark";
import NoteModel from "../../model/Note";
import { Dispatch } from "redux";

export function handleNotes(notes: NoteModel[]) {
  return { type: "HANDLE_NOTES", payload: notes };
}
export function handleBooks(books: BookModel[]) {
  return { type: "HANDLE_BOOKS", payload: books };
}
export function handleSearchBooks(searchBooks: number[]) {
  return { type: "HANDLE_SEARCH_BOOKS", payload: searchBooks };
}
export function handleSearch(isSearch: boolean) {
  return { type: "HANDLE_SEARCH", payload: isSearch };
}
export function handleList(mode: string) {
  return { type: "HANDLE_LIST", payload: mode };
}
export function handleMessage(message: string) {
  return { type: "HANDLE_MESSAGE", payload: message };
}
export function handleMessageBox(isShow: boolean) {
  return { type: "HANDLE_MESSAGE_BOX", payload: isShow };
}
export function handleSortDisplay(isSortDisplay: boolean) {
  return { type: "HANDLE_SORT_DISPLAY", payload: isSortDisplay };
}
export function handleSort(isSort: boolean) {
  return { type: "HANDLE_SORT", payload: isSort };
}
export function handleFirst(isFirst: string) {
  return { type: "HANDLE_FIRST", payload: isFirst };
}
export function handleSortCode(sortCode: { sort: number; order: number }) {
  return { type: "HANDLE_SORT_CODE", payload: sortCode };
}
export function handleEpubs(epubs: any) {
  return { type: "HANDLE_EPUBS", payload: epubs };
}
export function handleCovers(covers: { key: string; url: string }[]) {
  return { type: "HANDLE_COVERS", payload: covers };
}
export function handleBookmarks(bookmarks: BookmarkModel[]) {
  return { type: "HANDLE_COVERS", payload: bookmarks };
}
export function handleFetchBooks() {
  return (dispatch: Dispatch) => {
    localforage.getItem("books", (err, value) => {
      let bookArr: any = value;
      dispatch(handleBooks(bookArr));
      let epubArr: any = [];
      if (bookArr === null) {
        epubArr = null;
      } else {
        bookArr.forEach((item: BookModel) => {
          let epub = (window as any).ePub({
            bookPath: item.content,
            restore: false,
          });
          epubArr.push(epub);
          dispatch(handleEpubs(epubArr));
          let coverArr: { key: string; url: string }[] = [];
          epubArr.forEach(async (item: any, index: number) => {
            await item
              .coverUrl()
              .then((url: string) => {
                coverArr.push({ key: bookArr[index].key, url: url });
                if (coverArr.length === bookArr.length) {
                  dispatch(handleCovers(coverArr));
                }
              })
              .catch((err: any) => {
                coverArr.push({ key: bookArr[index].key, url: "" });
                if (coverArr.length === bookArr.length) {
                  dispatch(handleCovers(coverArr));
                }
                console.log(err, "Error occurs");
              });
          });
        });
      }
    });
  };
}
export function handleFetchSortCode() {
  return (dispatch: Dispatch) => {
    let sortCode = OtherUtil.getSortCode();
    dispatch(handleSortCode(sortCode));
  };
}
export function handleFetchList() {
  return (dispatch: Dispatch) => {
    let isList = OtherUtil.getReaderConfig("isList") || "card";
    dispatch(handleList(isList));
  };
}
