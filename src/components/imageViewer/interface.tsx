import BookModel from "../../models/Book";
export interface ImageViewerProps {
  rendition: any;
  isShow: boolean;
  handleLeaveReader: (position: string) => void;
  handleEnterReader: (position: string) => void;
  t: any;
  currentBook: BookModel;
}
export interface ImageViewerStates {
  isShowImage: boolean;
  imageRatio: string;
  imageName: string;
  zoomIndex: number;
  rotateIndex: number;
}
