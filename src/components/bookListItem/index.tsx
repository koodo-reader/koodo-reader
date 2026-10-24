import { connect } from "../../store/legacyConnect";
import {
  handleReadingBook,
  handleActionDialog,
  handleRefreshBookCover,
  handleSelectBook,
  handleSelectedBooks,
  handleFetchBooks,
  handleCollectionDialogBooks,
  handleAddCollectionDialog,
} from "../../store/actions";
import { withTranslation } from "react-i18next";

import { stateType } from "../../store";
import BookListItem from "./component";
import { withRouter } from "react-router-dom";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    isSelectBook: state.manager.isSelectBook,
    isOpenActionDialog: state.book.isOpenActionDialog,
    selectedBooks: state.manager.selectedBooks,
    refreshBookKey: state.manager.refreshBookKey,
    percentage: state.progressPanel.percentage,
  };
};
const actionCreator = {
  handleReadingBook,
  handleActionDialog,
  handleRefreshBookCover,
  handleSelectBook,
  handleSelectedBooks,
  handleFetchBooks,
  handleCollectionDialogBooks,
  handleAddCollectionDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(BookListItem as any) as any) as any);
