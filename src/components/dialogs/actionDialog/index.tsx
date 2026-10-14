import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleSelectBook,
  handleAddDialog,
  handleSelectedBooks,
  handleActionDialog,
  handleReadingBook,
  handleFetchBooks,
  handleDetailDialog,
  handleCollectionDialog,
  handleCollectionDialogMode,
  handleCollectionDialogKey,
  handleCollectionDetailDialog,
  handleCurrentCollectionKey,
  handleAddCollectionDialog,
} from "../../../store/actions";

import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import ActionDialog from "./component";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    mode: state.sidebar.mode,
    currentBook: state.book.currentBook,

    isSelectBook: state.manager.isSelectBook,

    deletedBooks: state.manager.deletedBooks,
  };
};
const actionCreator = {
  handleEditDialog,
  handleAddDialog,
  handleDeleteDialog,
  handleReadingBook,
  handleActionDialog,
  handleFetchBooks,
  handleDetailDialog,
  handleSelectBook,
  handleSelectedBooks,
  handleCollectionDialog,
  handleCollectionDialogMode,
  handleCollectionDialogKey,
  handleCollectionDetailDialog,
  handleCurrentCollectionKey,
  handleAddCollectionDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(ActionDialog as any) as any) as any);
