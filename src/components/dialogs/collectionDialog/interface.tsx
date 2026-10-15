export interface CollectionDialogProps {
  collectionDialogKey: string;
  handleCollectionDialog: (isOpen: boolean) => void;
  handleCollectionDialogKey: (key: string) => void;
  handleFetchBooks: () => void;
  handleActionDialog: (isOpen: boolean) => void;
  t: (title: string) => string;
}
export interface CollectionDialogState {
  name: string;
}
