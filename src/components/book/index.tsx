//卡片模式下的图书显示
import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
} from "../../redux/actions/book";
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
};
export default connect(mapStateToProps, actionCreator)(Book);
