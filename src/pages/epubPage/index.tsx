import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
} from "../../store/actions";
import EpubReader from "./component";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
    currentBook: state.book.currentBook,
    currentEpub: state.book.currentEpub,
    isReading: state.book.isReading,
  };
};
const actionCreator = {
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
  handleActionDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(EpubReader));
