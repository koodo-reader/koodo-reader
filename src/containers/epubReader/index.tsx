import {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchChapters,
  handleFetchPercentage,
  handleMessageBox,
  handleFetchBooks,
  handleRenderFunc,
} from "../../store/actions";

import "./index.css";
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
  handleRenderFunc,
};
export default connect(mapStateToProps, actionCreator)(Reader);
