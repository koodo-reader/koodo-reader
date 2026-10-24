import { connect } from "../../store/legacyConnect";
import {
  handleReadingState,
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
  handleFetchPlugins,
  handleScale,
  handleBackgroundColor,
} from "../../store/actions";
import Viewer from "./component";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    htmlBook: state.reader.htmlBook,
    isNavLocked: state.reader.isNavLocked,
    isSettingLocked: state.reader.isSettingLocked,
    isDockedRight: state.reader.isDockedRight,
    isOpenMenu: state.viewArea.isOpenMenu,
    isAuthed: state.manager.isAuthed,
    readerMode: state.reader.readerMode,
    menuMode: state.viewArea.menuMode,
    scale: state.reader.scale,
    isFitPage: state.reader.isFitPage,
    margin: state.reader.margin,
    isHideBackground: state.reader.isHideBackground,
    isParagraphMode: state.reader.isParagraphMode,
    isReadingRuler: state.reader.isReadingRuler,
    isSpeedReading: state.reader.isSpeedReading,
    isMergeWord: state.reader.isMergeWord,
    isShowPageBorder: state.reader.isShowPageBorder,
    textOrientation: state.reader.textOrientation,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = {
  handleReadingState,
  handleHtmlBook,
  handleRenderBookFunc,
  handleFetchBooks,
  handleOpenMenu,
  handleCurrentChapter,
  handleNoteKey,
  handleCurrentChapterIndex,
  handleFetchNotes,
  handleFetchBookmarks,
  handleMenuMode,
  handleFetchPlugins,
  handleScale,
  handleBackgroundColor,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(Viewer as any) as any);
