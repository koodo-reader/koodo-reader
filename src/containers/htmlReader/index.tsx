import {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchChapters,
} from "../../store/actions/reader";
import { handleFetchPercentage } from "../../store/actions/progressPanel";
import {
  handleMessageBox,
  handleFetchBooks,
} from "../../store/actions/manager";
import { connect } from "react-redux";
import { stateType } from "../../store";
import Reader from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    isMessage: state.manager.isMessage,
  };
};
const actionCreator = {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchChapters,
  handleMessageBox,
  handleFetchPercentage,
  handleFetchBooks,
};
export default connect(mapStateToProps, actionCreator)(Reader);
