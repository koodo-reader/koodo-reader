export interface DeletePopupProps {
  t: (title: string) => string;
  name: string;
  title: string;
  description: string;
  handleDeletePopup: (isOpenDelete: boolean) => void;
  handleDeleteOperation: () => void;
}
