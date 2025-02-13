import {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchBooks,
  handleReadingBook,
  handleFetchPercentage,
  handleReaderMode,
} from "../../store/actions";
import { connect } from "react-redux";
import { stateType } from "../../store";
import Reader from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    percentage: state.progressPanel.percentage,
    htmlBook: state.reader.htmlBook,
  };
};
const actionCreator = {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchBooks,
  handleReadingBook,
  handleFetchPercentage,
  handleReaderMode,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(Reader as any) as any);
