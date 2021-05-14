//控制列表模式下的图书显示
import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleReadingBook,
  handleDragItem,
} from "../../store/actions/book";
import { withTranslation } from "react-i18next";
import {
  handleMessageBox,
  handleMessage,
  handleFetchBooks,
} from "../../store/actions/manager";
import {
  handleDragToLove,
  handleDragToDelete,
} from "../../store/actions/sidebar";
import { stateType } from "../../store";
import BookItem from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    isReading: state.book.isReading,
    percentage: state.progressPanel.percentage,
    currentBook: state.book.currentBook,
    isDragToLove: state.sidebar.isDragToLove,
    isDragToDelete: state.sidebar.isDragToDelete,
    dragItem: state.book.dragItem,
    mode: state.sidebar.mode,
  };
};
const actionCreator = {
  handleReadingBook,
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleMessageBox,
  handleMessage,
  handleDragItem,
  handleDragToLove,
  handleDragToDelete,
  handleFetchBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(BookItem as any));
