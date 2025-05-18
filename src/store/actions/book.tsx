import BookModel from "../../models/Book";
export function handleEditDialog(mode: boolean) {
  return { type: "HANDLE_EDIT_DIALOG", payload: mode };
}
export function handleDeleteDialog(mode: boolean) {
  return { type: "HANDLE_DELETE_DIALOG", payload: mode };
}
export function handleAddDialog(mode: boolean) {
  return { type: "HANDLE_ADD_DIALOG", payload: mode };
}
export function handleRenderBookFunc(renderBookFunc: () => void) {
  return { type: "HANDLE_RENDER_BOOK_FUNC", payload: renderBookFunc };
}
export function handleImportBookFunc(importBookFunc: () => void) {
  return { type: "HANDLE_IMPORT_BOOK_FUNC", payload: importBookFunc };
}
export function handleCloudSyncFunc(cloudSyncFunc: () => void) {
  return { type: "HANDLE_CLOUD_SYNC_FUNC", payload: cloudSyncFunc };
}
export function handleRenderNoteFunc(renderNoteFunc: () => void) {
  return { type: "HANDLE_RENDER_NOTE_FUNC", payload: renderNoteFunc };
}
export function handleActionDialog(mode: boolean) {
  return { type: "HANDLE_ACTION_DIALOG", payload: mode };
}
export function handleReadingState(state: boolean) {
  return { type: "HANDLE_READING_STATE", payload: state };
}
export function handleReadingBook(book: BookModel) {
  return { type: "HANDLE_READING_BOOK", payload: book };
}
export function handleDragItem(key: string) {
  return { type: "HANDLE_DRAG_ITEM", payload: key };
}
export function handleCurrentPage(page: number) {
  return { type: "HANDLE_CURRENT_PAGE", payload: page };
}
export function handleTotalPage(page: number) {
  return { type: "HANDLE_TOTAL_PAGE", payload: page };
}
