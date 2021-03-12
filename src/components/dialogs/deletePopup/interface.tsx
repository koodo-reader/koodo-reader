export interface DeletePopupProps {
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  name: string;
  title: string;
  description: string;
  handleDeletePopup: (isOpenDelete: boolean) => void;
  handleDeleteOpearion: () => void;
}
