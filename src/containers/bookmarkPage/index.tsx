//我的书签页面
import { connect } from "react-redux";
import { handleFetchBookmarks } from "../../store/actions/reader";
import { handleReadingBook, handleReadingEpub } from "../../store/actions/book";
import { handleMessageBox, handleMessage } from "../../store/actions/manager";
import { stateType } from "../../store";
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
  handleReadingBook,
  handleReadingEpub,
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(BookmarkPage as any));
