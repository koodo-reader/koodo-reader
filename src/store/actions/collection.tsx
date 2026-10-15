export function handleCollectionDialog(isOpen: boolean) {
  return { type: "HANDLE_COLLECTION_DIALOG", payload: isOpen };
}

export function handleCollectionDialogBooks(bookKeys: string[]) {
  return { type: "HANDLE_COLLECTION_DIALOG_BOOKS", payload: bookKeys };
}

export function handleCollectionDialogKey(key: string) {
  return { type: "HANDLE_COLLECTION_DIALOG_KEY", payload: key };
}

export function handleCollectionDetailDialog(isOpen: boolean) {
  return { type: "HANDLE_COLLECTION_DETAIL_DIALOG", payload: isOpen };
}

export function handleAddCollectionDialog(isOpen: boolean) {
  return { type: "HANDLE_ADD_COLLECTION_DIALOG", payload: isOpen };
}

export function handleCurrentCollectionKey(key: string) {
  return { type: "HANDLE_CURRENT_COLLECTION_KEY", payload: key };
}
