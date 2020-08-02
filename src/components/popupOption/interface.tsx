import BookModel from "../../model/Book";
import DigestModel from "../../model/Digest";
export interface PopupOptionProps {
  currentBook: BookModel;
  currentEpub: any;
  selection: string;
  digests: DigestModel[];
  chapters: any;
  color: number;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
  handleOpenMenu: (isOpenMenu: boolean) => void;
  handleMenuMode: (menu: string) => void;
}
