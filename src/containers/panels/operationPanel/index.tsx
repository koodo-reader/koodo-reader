import { connect } from "../../../store/legacyConnect";
import {
  handleFetchBookmarks,
  handleShowBookmark,
  handleSearch,
  handleReadingState,
  handleHtmlBook,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import OperationPanel from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    htmlBook: state.reader.htmlBook,
  };
};
const actionCreator = {
  handleReadingState,
  handleFetchBookmarks,
  handleShowBookmark,
  handleSearch,
  handleHtmlBook,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(OperationPanel as any) as any);
