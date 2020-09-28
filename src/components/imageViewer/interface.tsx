export interface ImageViewerProps {
  rendition: any;
  isShow: boolean;
  handleLeaveReader: (position: string) => void;
  handleEnterReader: (position: string) => void;
}
export interface ImageViewerStates {
  isShowImage: boolean;
  imageRatio: string;
  zoomIndex: number;
}
