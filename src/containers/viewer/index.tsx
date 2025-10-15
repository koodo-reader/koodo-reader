import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingState,
  handleReadingBook,
  handleHtmlBook,
  handleRenderBookFunc,
  handleFetchBooks,
  handleMenuMode,
  handleNoteKey,
  handleOpenMenu,
  handleCurrentChapter,
  handleCurrentChapterIndex,
  handleFetchNotes,
  handleFetchBookmarks,
  handlePercentage,
  handleFetchPercentage,
  handleFetchPlugins,
  handleReaderMode,
  handleFetchAuthed,
  handleScale,
} from "../../store/actions";
import Viewer from "./component";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
    currentBook: state.book.currentBook,
    isReading: state.book.isReading,
    renderNoteFunc: state.book.renderNoteFunc,
    htmlBook: state.reader.htmlBook,
    isNavLocked: state.reader.isNavLocked,
    isSettingLocked: state.reader.isSettingLocked,
    isOpenMenu: state.viewArea.isOpenMenu,
    books: state.manager.books,
    notes: state.reader.notes,
    readerMode: state.reader.readerMode,
    defaultSyncOption: state.backupPage.defaultSyncOption,
    menuMode: state.viewArea.menuMode,
    scale: state.reader.scale,
    margin: state.reader.margin,
    isHideBackground: state.reader.isHideBackground,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = {
  handleReadingState,
  handleReadingBook,
  handleActionDialog,
  handleHtmlBook,
  handleRenderBookFunc,
  handleFetchBooks,
  handleOpenMenu,
  handleCurrentChapter,
  handleNoteKey,
  handleCurrentChapterIndex,
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchPercentage,
  handlePercentage,
  handleMenuMode,
  handleFetchPlugins,
  handleReaderMode,
  handleFetchAuthed,
  handleScale,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(Viewer as any) as any);
