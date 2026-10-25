import BookModel from "../../models/Book";
import HtmlBook from "../../models/HtmlBook";

export interface ViewerProps {
  book: BookModel;
  rendition: any;

  isShow: boolean;




  handleLeaveReader: (position: string) => void;
  handleEnterReader: (position: string) => void;



}
export interface ViewerState {


  isTouch: boolean;

  isDisablePopup: boolean;
  chapter: string;
  pageOffset: string;
  pageWidth: string;
  chapterDocIndex: number;


  rect: any;
  rendition: any;
}
