const initState = {
  isOpenCollectionDialog: false,
  collectionDialogBooks: [],
  collectionDialogKey: "",
  isOpenCollectionDetailDialog: false,
  isOpenAddCollectionDialog: false,
  currentCollectionKey: "",
};
export function collection(
  state = initState,
  action: { type: string; payload: any }
) {
  switch (action.type) {
    case "HANDLE_COLLECTION_DIALOG":
      return {
        ...state,
        isOpenCollectionDialog: action.payload,
      };
    case "HANDLE_COLLECTION_DIALOG_BOOKS":
      return {
        ...state,
        collectionDialogBooks: action.payload,
      };
    case "HANDLE_COLLECTION_DIALOG_KEY":
      return {
        ...state,
        collectionDialogKey: action.payload,
      };
    case "HANDLE_COLLECTION_DETAIL_DIALOG":
      return {
        ...state,
        isOpenCollectionDetailDialog: action.payload,
      };
    case "HANDLE_ADD_COLLECTION_DIALOG":
      return {
        ...state,
        isOpenAddCollectionDialog: action.payload,
      };
    case "HANDLE_CURRENT_COLLECTION_KEY":
      return {
        ...state,
        currentCollectionKey: action.payload,
      };
    default:
      return state;
  }
}
