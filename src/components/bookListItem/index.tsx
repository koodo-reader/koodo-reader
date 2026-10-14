import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleReadingBook,
  handleFetchBooks,
  handleSelectedBooks,
  handleSelectBook,
  handleActionDialog,
  handleRefreshBookCover,
  handleCollectionDialog,
  handleCollectionDialogMode,
  handleCollectionDialogBooks,
  handleCollectionDialogKey,
} from "../../store/actions";
import { withTranslation } from "react-i18next";

import { stateType } from "../../store";
import BookListItem from "./component";
import { withRouter } from "react-router-dom";
const mapStateToProps = (state: stateType) => {
  return {
    percentage: state.progressPanel.percentage,
    currentBook: state.book.currentBook,
    isSelectBook: state.manager.isSelectBook,
    selectedBooks: state.manager.selectedBooks,
    isOpenActionDialog: state.book.isOpenActionDialog,
    refreshBookKey: state.manager.refreshBookKey,
  };
};
const actionCreator = {
  handleReadingBook,
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleActionDialog,
  handleSelectBook,
  handleFetchBooks,
  handleSelectedBooks,
  handleRefreshBookCover,
  handleCollectionDialog,
  handleCollectionDialogMode,
  handleCollectionDialogBooks,
  handleCollectionDialogKey,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(BookListItem as any) as any) as any);
