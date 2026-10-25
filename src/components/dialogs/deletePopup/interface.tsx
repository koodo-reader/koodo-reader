export interface DeletePopupProps {
  name: string;
  title: string;
  description: string;
  handleDeletePopup: (isOpenDelete: boolean) => void;
  handleDeleteOpearion: () => void;
}
