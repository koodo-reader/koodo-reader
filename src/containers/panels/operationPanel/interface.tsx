import BookModel from "../../../models/Book";
import HtmlBookModel from "../../../models/HtmlBook";
import { RouteComponentProps } from "react-router";

export interface OperationPanelProps extends RouteComponentProps<any> {
  currentBook: BookModel;

  htmlBook: HtmlBookModel;
  rendition: any;
  currentDuration: number;


  handleReadingState: (isReading: boolean) => void;
  handleFetchBookmarks: () => void;
  handleSearch: (isSearch: boolean) => void;

  handleShowBookmark: (isShowBookmark: boolean) => void;

  t: (title: string) => string;
  handleHtmlBook: (htmlBook: HtmlBookModel | null) => void;
}

export interface OperationPanelState {
  timeLeft: number;
  isFullscreen: boolean;
}
