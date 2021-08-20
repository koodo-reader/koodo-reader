import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleReadingBook,
  handleDragItem,
  handleMessageBox,
  handleMessage,
  handleFetchBooks,
} from "../../store/actions";
import { withTranslation } from "react-i18next";

import { stateType } from "../../store";
import BookItem from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    isReading: state.book.isReading,
    percentage: state.progressPanel.percentage,
    currentBook: state.book.currentBook,
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
  handleFetchBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(BookItem as any));
