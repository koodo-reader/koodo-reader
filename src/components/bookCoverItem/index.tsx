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
import BookCoverItem from "./component";
import { stateType } from "../../store";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
    isDragToLove: state.sidebar.isDragToLove,
    isDragToDelete: state.sidebar.isDragToDelete,
    isCollapsed: state.sidebar.isCollapsed,
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
export default connect(mapStateToProps, actionCreator)(BookCoverItem);
