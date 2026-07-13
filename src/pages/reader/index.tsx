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
  handlePdfCropDialog,
  handleSpeechDialog,
  handleAnnotationDialog,
  handleScale,
  handleFetchAuthed,
  handleFetchUserInfo,
  handleBackgroundColor,
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
    isPdfCropOpen: state.reader.isPdfCropOpen,
    isSpeechOpen: state.reader.isSpeechOpen,
    isAnnotationOpen: state.reader.isAnnotationOpen,
    isOpenPopupOptionDialog: state.backupPage.isOpenPopupOptionDialog,
    isSettingLocked: state.reader.isSettingLocked,
    isAuthed: state.manager.isAuthed,
    isSearch: state.manager.isSearch,
    isSettingOpen: state.manager.isSettingOpen,
    scale: state.reader.scale,
    renderBookFunc: state.book.renderBookFunc,
    isHideMenuButton: state.reader.isHideMenuButton,
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
  handlePdfCropDialog,
  handleScale,
  handleFetchAuthed,
  handleSpeechDialog,
  handleAnnotationDialog,
  handleFetchUserInfo,
  handleBackgroundColor,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(Reader as any) as any);
