import {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchChapters,
  handleFetchBooks,
} from "../../store/actions";
import { connect } from "react-redux";
import { stateType } from "../../store";
import Reader from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    percentage: state.progressPanel.percentage,
  };
};
const actionCreator = {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchChapters,
  handleFetchBooks,
};
export default connect(mapStateToProps, actionCreator)(Reader);
