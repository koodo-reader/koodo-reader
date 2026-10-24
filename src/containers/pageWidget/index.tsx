import { connect } from "react-redux";
import { stateType } from "../../store";
import PageWidget from "./component";
import {
  handleJumpPosition,
  handleFetchNotes,
} from "../../store/actions";
import { withTranslation } from "react-i18next";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    currentChapter: state.reader.currentChapter,
    readerMode: state.reader.readerMode,
    isNavLocked: state.reader.isNavLocked,
    isSettingLocked: state.reader.isSettingLocked,
    isDockedRight: state.reader.isDockedRight,
    backgroundColor: state.reader.backgroundColor,
    isHideFooter: state.reader.isHideFooter,
    isHideHeader: state.reader.isHideHeader,
    isShowPageBorder: state.reader.isShowPageBorder,
    textOrientation: state.reader.textOrientation,
    htmlBook: state.reader.htmlBook,
    isShowBookmark: state.viewArea.isShowBookmark,
    isAuthed: state.manager.isAuthed,
    jumpPosition: state.reader.jumpPosition,
  };
};
const actionCreator = {
  handleJumpPosition,
  handleFetchNotes,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PageWidget) as any);
