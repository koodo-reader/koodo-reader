import { connect } from "react-redux";
import { stateType } from "../../../store";
import ContentList from "./component";
import {
  handleCurrentChapter,
  handleCurrentChapterIndex,
} from "../../../store/actions";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    chapters: state.reader.chapters,
    htmlBook: state.reader.htmlBook,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = { handleCurrentChapter, handleCurrentChapterIndex };
export default connect(mapStateToProps, actionCreator)(ContentList);
