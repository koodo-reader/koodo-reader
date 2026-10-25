import BookModel from "../../../models/Book";
import HtmlBookModel from "../../../models/HtmlBook";

export interface NavigationPanelProps {

  totalDuration: number;
}

export interface NavigationPanelState {
  currentTab: string;

  searchState: string;
  searchList: any;
  cover: string;
  isCoverExist: boolean;
  activeSearchKey: string | null;
  collapsedChapters: Set<number>;
}
