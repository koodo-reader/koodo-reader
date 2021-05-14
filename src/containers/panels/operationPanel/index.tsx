//图书操作页面
import { connect } from "react-redux";
import {
  handleBookmarks,
  handleFetchBookmarks,
} from "../../../store/actions/reader";
import {
  handleOpenMenu,
  handleShowBookmark,
} from "../../../store/actions/viewArea";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import {
  handleMessageBox,
  handleMessage,
  handleSearch,
} from "../../../store/actions/manager";
import { handleReadingState } from "../../../store/actions/book";
import OperationPanel from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    books: state.manager.books,
    locations: state.progressPanel.locations,
    flattenChapters: state.reader.flattenChapters,
  };
};
const actionCreator = {
  handleBookmarks,
  handleReadingState,
  handleFetchBookmarks,
  handleMessageBox,
  handleMessage,
  handleOpenMenu,
  handleShowBookmark,
  handleSearch,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(OperationPanel as any));
