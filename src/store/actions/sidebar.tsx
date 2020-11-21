export function handleShelfIndex(shelfIndex: number) {
  return { type: "HANDLE_SHELF_INDEX", payload: shelfIndex };
}

export function handleMode(mode: string) {
  return { type: "HANDLE_MODE", payload: mode };
}
export function handleDragToLove(isDragToLove: boolean) {
  return { type: "HANDLE_DRAG_TO_LOVE", payload: isDragToLove };
}
export function handleDragToDelete(isDragToDelete: boolean) {
  return { type: "HANDLE_DRAG_TO_DELETE", payload: isDragToDelete };
}
