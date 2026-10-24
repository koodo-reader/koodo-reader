import {
  handleFetchBooks,
  handleReadingBook,
  handleFetchPercentage,
  handleReaderMode,
  handleMenuMode,
  handleOriginalText,
  handleOpenMenu,
  handleConvertDialog,
  handleScalePageDialog,
  handlePdfCropDialog,
  handleStudyLangDialog,
  handleAssistReadDialog,
  handleSpeechDialog,
  handleAnnotationDialog,
  handleFetchAuthed,
  handleFetchUserInfo,
  handleBackgroundColor,
} from "../../store/actions";
import { connect } from "../../store/legacyConnect";
import { stateType } from "../../store";
import Reader from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    htmlBook: state.reader.htmlBook,
    readerMode: state.reader.readerMode,
    isNavLocked: state.reader.isNavLocked,
    isConvertOpen: state.reader.isConvertOpen,
    isScaleOpen: state.reader.isScaleOpen,
    isPdfCropOpen: state.reader.isPdfCropOpen,
    isStudyLangOpen: state.reader.isStudyLangOpen,
    isAssistReadOpen: state.reader.isAssistReadOpen,
    isSpeechOpen: state.reader.isSpeechOpen,
    isAnnotationOpen: state.reader.isAnnotationOpen,
    isOpenPopupOptionDialog: state.backupPage.isOpenPopupOptionDialog,
    isSettingLocked: state.reader.isSettingLocked,
    isDockedRight: state.reader.isDockedRight,
    isSettingOpen: state.manager.isSettingOpen,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleReadingBook,
  handleFetchPercentage,
  handleReaderMode,
  handleMenuMode,
  handleOriginalText,
  handleOpenMenu,
  handleConvertDialog,
  handleScalePageDialog,
  handlePdfCropDialog,
  handleStudyLangDialog,
  handleAssistReadDialog,
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
