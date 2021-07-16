//卡片模式下的图书显示
import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingBook,
  handleDragItem,
  handleDeleteDialog,
  handleMessageBox,
  handleMessage,
  handleDragToLove,
  handleDragToDelete,
} from "../../store/actions";

import Book from "./component";
import { stateType } from "../../store";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
    isDragToLove: state.sidebar.isDragToLove,
    isDragToDelete: state.sidebar.isDragToDelete,
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
  handleDragToLove,
  handleDragToDelete,
  handleDeleteDialog,
};
export default connect(mapStateToProps, actionCreator)(Book);
