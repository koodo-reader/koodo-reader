import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
  handleHtmlBook,
  handleRenderFunc,
} from "../../store/actions";
import Viewer from "./component";
import { stateType } from "../../store";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
    currentBook: state.book.currentBook,
    isReading: state.book.isReading,
    htmlBook: state.reader.htmlBook,
  };
};
const actionCreator = {
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
  handleActionDialog,
  handleHtmlBook,
  handleRenderFunc,
};
export default connect(mapStateToProps, actionCreator)(Viewer as any);
