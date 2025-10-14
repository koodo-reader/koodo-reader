import {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchBooks,
  handleReadingBook,
  handleFetchPercentage,
  handleReaderMode,
  handleMenuMode,
  handleOriginalText,
  handleOpenMenu,
  handleConvertDialog,
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
    readerMode: state.reader.readerMode,
    isNavLocked: state.reader.isNavLocked,
    isConvertOpen: state.reader.isConvertOpen,
    isSettingLocked: state.reader.isSettingLocked,
    isAuthed: state.manager.isAuthed,
    isSearch: state.manager.isSearch,
    scale: state.reader.scale,
  };
};
const actionCreator = {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchBooks,
  handleReadingBook,
  handleFetchPercentage,
  handleReaderMode,
  handleMenuMode,
  handleOriginalText,
  handleOpenMenu,
  handleConvertDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(Reader as any) as any);
