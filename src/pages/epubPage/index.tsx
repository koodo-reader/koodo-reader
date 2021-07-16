//卡片模式下的图书显示
import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
  handleMessageBox,
  handleMessage,
} from "../../store/actions";
import EpubReader from "./component";
import { stateType } from "../../store";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
    currentBook: state.book.currentBook,
    isReading: state.book.isReading,
  };
};
const actionCreator = {
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
  handleActionDialog,
  handleMessageBox,
  handleMessage,
};
export default connect(mapStateToProps, actionCreator)(EpubReader);
