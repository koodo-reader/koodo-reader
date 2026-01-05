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
    readerMode: state.reader.readerMode,
    htmlBook: state.reader.htmlBook,
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
