//卡片模式下的图书显示
import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
} from "../../redux/actions/book";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import Book from "./component";
import { stateType } from "../../redux/store";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
    currentBook: state.book.currentBook,
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
export default connect(mapStateToProps, actionCreator)(Book);
