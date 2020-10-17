import BookmarkModel from "../../model/Bookmark";
import BookModel from "../../model/Book";
import { RouteComponentProps } from "react-router";

export interface BookmarkPageProps extends RouteComponentProps<any> {
  bookmarks: BookmarkModel[];
  books: BookModel[];
  handleFetchBookmarks: () => void;
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface BookmarkPageState {
  bookmarks: BookmarkModel[];
}
