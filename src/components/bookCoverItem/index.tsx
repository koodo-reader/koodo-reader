import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingBook,
  handleDragItem,
  handleDeleteDialog,
  handleMessageBox,
  handleMessage,
} from "../../store/actions";
import BookCoverItem from "./component";
import { stateType } from "../../store";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
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
  handleDeleteDialog,
};
export default connect(mapStateToProps, actionCreator)(BookCoverItem);
