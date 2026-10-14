export interface CollectionDialogProps {
  collectionDialogMode: string;
  collectionDialogBooks: string[];
  collectionDialogKey: string;
  handleCollectionDialog: (isOpen: boolean) => void;
  handleCollectionDialogMode: (mode: string) => void;
  handleCollectionDialogBooks: (books: string[]) => void;
  handleCollectionDialogKey: (key: string) => void;
  handleSelectBook: (isSelectBook: boolean) => void;
  handleSelectedBooks: (selectedBooks: string[]) => void;
  handleFetchBooks: () => void;
  handleActionDialog: (isOpen: boolean) => void;
  t: (title: string) => string;
}
export interface CollectionDialogState {
  name: string;
}
