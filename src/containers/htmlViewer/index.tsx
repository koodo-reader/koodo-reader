//卡片模式下的图书显示
import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
} from "../../store/actions/book";
import { handleMessageBox, handleMessage } from "../../store/actions/manager";
import { handleHtmlBook } from "../../store/actions/reader";
import Viewer from "./component";
import { stateType } from "../../store";
import { handleRenderFunc } from "../../store/actions/book";

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
  handleMessageBox,
  handleMessage,
  handleHtmlBook,
  handleRenderFunc,
};
export default connect(mapStateToProps, actionCreator)(Viewer as any);
