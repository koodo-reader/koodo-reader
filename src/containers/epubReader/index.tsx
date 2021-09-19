import {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchChapters,
  handleFetchPercentage,
  handleFetchBooks,
  handleRenderFunc,
} from "../../store/actions";

import "./index.css";
import { connect } from "react-redux";
import { stateType } from "../../store";
import Reader from "./component";
import { withTranslation } from "react-i18next";
const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
  };
};
const actionCreator = {
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchChapters,
  handleFetchPercentage,
  handleFetchBooks,
  handleRenderFunc,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(Reader));
