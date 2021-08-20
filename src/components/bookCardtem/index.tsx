import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingBook,
  handleDragItem,
  handleDeleteDialog,
  handleMessageBox,
  handleMessage,
} from "../../store/actions";

import Book from "./component";
import { stateType } from "../../store";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
    dragItem: state.book.dragItem,
    currentBook: state.book.currentBook,
  };
};
const actionCreator = {
  handleReadingBook,
  handleActionDialog,
  handleMessageBox,
  handleMessage,
  handleDragItem,
  handleDeleteDialog,
};
export default connect(mapStateToProps, actionCreator)(Book);
