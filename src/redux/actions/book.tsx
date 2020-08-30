import BookModel from "../../model/Book";
export function handleEditDialog(mode: boolean) {
  return { type: "HANDLE_EDIT_DIALOG", payload: mode };
}
export function handleDeleteDialog(mode: boolean) {
  return { type: "HANDLE_DELETE_DIALOG", payload: mode };
}
export function handleAddDialog(mode: boolean) {
  return { type: "HANDLE_ADD_DIALOG", payload: mode };
}
export function handleActionDialog(mode: boolean) {
  return { type: "HANDLE_ACTION_DIALOG", payload: mode };
}
export function handleReadingState(state: boolean) {
  return { type: "HANDLE_READING_STATE", payload: state };
}
export function handleReadingBook(book: BookModel) {
  console.log(book, "book");
  return { type: "HANDLE_READING_BOOK", payload: book };
}
export function handleReadingEpub(epub: any) {
  return { type: "HANDLE_READING_EPUB", payload: epub };
}
