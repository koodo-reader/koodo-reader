import { connect } from "react-redux";
import { stateType } from "../../store";
import Background from "./component";
import {
  handleCurrentChapter,
  handleCurrentChapterIndex,
} from "../../store/actions";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    currentChapter: state.reader.currentChapter,
    readerMode: state.reader.readerMode,
    isNavLocked: state.reader.isNavLocked,
    isSettingLocked: state.reader.isSettingLocked,
    backgroundColor: state.reader.backgroundColor,
    isHideFooter: state.reader.isHideFooter,
    isHideHeader: state.reader.isHideHeader,
    currentChapterIndex: state.reader.currentChapterIndex,
    htmlBook: state.reader.htmlBook,
    isShowBookmark: state.viewArea.isShowBookmark,
  };
};
const actionCreator = { handleCurrentChapter, handleCurrentChapterIndex };
export default connect(mapStateToProps, actionCreator)(Background as any);
