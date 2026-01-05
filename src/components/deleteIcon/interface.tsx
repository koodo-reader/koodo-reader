export interface DeleteIconProps {
  mode: string;
  index: number;
  tagName: string;
  itemKey: string;
  handleFetchNotes: () => void;
  handleFetchBookmarks: () => void;
  renderHighlighters: () => void;
  handleShowDelete: (Deletekey: string) => void;
  t: (title: string) => string;
  handleShowBookmark: (isShowBookmark: boolean) => void;
  handleChangeTag: (index: number) => void;
  htmlBook: any;
}
export interface DeleteIconStates {
  deleteIndex: number;
  isOpenDelete: boolean;
}
