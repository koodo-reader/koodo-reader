import { connect } from "react-redux";
import {
  handleBookmarks,
  handleFetchBookmarks,
  handleOpenMenu,
  handleShowBookmark,
  handleSearch,
  handleReadingState,
  handleHtmlBook,
  handleReadingBook,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import OperationPanel from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    books: state.manager.books,
    htmlBook: state.reader.htmlBook,
    locations: state.progressPanel.locations,
    flattenChapters: state.reader.flattenChapters,
  };
};
const actionCreator = {
  handleBookmarks,
  handleReadingState,
  handleFetchBookmarks,
  handleOpenMenu,
  handleShowBookmark,
  handleSearch,
  handleHtmlBook,
  handleReadingBook,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(OperationPanel as any));
