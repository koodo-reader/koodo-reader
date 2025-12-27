import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleReadingBook,
  handleDragItem,
  handleFetchBooks,
  handleSelectedBooks,
  handleSelectBook,
  handleActionDialog,
} from "../../store/actions";
import { withTranslation } from "react-i18next";

import { stateType } from "../../store";
import BookListItem from "./component";
import { withRouter } from "react-router-dom";
const mapStateToProps = (state: stateType) => {
  return {
    percentage: state.progressPanel.percentage,
    currentBook: state.book.currentBook,
    dragItem: state.book.dragItem,
    isSelectBook: state.manager.isSelectBook,
    selectedBooks: state.manager.selectedBooks,
    isOpenActionDialog: state.book.isOpenActionDialog,
  };
};
const actionCreator = {
  handleReadingBook,
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleActionDialog,
  handleDragItem,
  handleSelectBook,
  handleFetchBooks,
  handleSelectedBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(BookListItem as any) as any) as any);
