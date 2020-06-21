import {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchDigests,
  handleFetchChapters,
  handleFetchHighlighters,
} from "../../redux/actions/reader";
import { handleFetchPercentage } from "../../redux/actions/progressPanel";
import { handleMessageBox } from "../../redux/actions/manager";
import "./reader.css";
import { connect } from "react-redux";
import { stateType } from "../../redux/store";
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
  handleFetchDigests,
  handleFetchChapters,
  handleFetchHighlighters,
  handleMessageBox,
  handleFetchPercentage,
};
export default connect(mapStateToProps, actionCreator)(Reader);
