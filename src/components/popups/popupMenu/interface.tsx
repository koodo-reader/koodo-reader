import BookModel from "../../../models/Book";
import HtmlBook from "../../../models/HtmlBook";
import { HighlightValue } from "../../../utils/common";

export interface PopupMenuProps {


  rendition: any;
  // cfiRange: any;
  rect: any;

  chapterDocIndex: number;
  chapter: string;

}
export interface PopupMenuStates {
  // cfiRange: string;
  rect: DOMRect | null;
}
