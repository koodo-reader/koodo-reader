import { connect } from "../../../store/legacyConnect";
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
  handleCollectionDialogKey,
  handleCollectionDetailDialog,
  handleCurrentCollectionKey,
  handleAddCollectionDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(ActionDialog as any) as any) as any);
