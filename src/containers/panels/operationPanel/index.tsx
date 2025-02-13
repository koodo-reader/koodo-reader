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
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    readerMode: state.reader.readerMode,
    books: state.manager.books,
    htmlBook: state.reader.htmlBook,
    locations: state.progressPanel.locations,
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
)(withTranslation()(OperationPanel as any) as any);
