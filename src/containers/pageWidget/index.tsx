import { connect } from "react-redux";
import { stateType } from "../../store";
import Background from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    locations: state.progressPanel.locations,
    currentChapter: state.reader.currentChapter,
    htmlBook: state.reader.htmlBook,
    isShowBookmark: state.viewArea.isShowBookmark,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(Background);
