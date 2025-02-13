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
    locations: state.progressPanel.locations,
    currentChapter: state.reader.currentChapter,
    readerMode: state.reader.readerMode,
    currentChapterIndex: state.reader.currentChapterIndex,
    htmlBook: state.reader.htmlBook,
    isShowBookmark: state.viewArea.isShowBookmark,
  };
};
const actionCreator = { handleCurrentChapter, handleCurrentChapterIndex };
export default connect(mapStateToProps, actionCreator)(Background as any);
