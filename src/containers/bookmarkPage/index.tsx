//我的书签页面
import { connect } from "react-redux";
import { handleFetchBookmarks } from "../../redux/actions/reader";
import {
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
} from "../../redux/actions/book";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import BookmarkPage from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    bookmarks: state.reader.bookmarks,
    books: state.manager.books,
  };
};
const actionCreator = {
  handleFetchBookmarks,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(BookmarkPage as any));
