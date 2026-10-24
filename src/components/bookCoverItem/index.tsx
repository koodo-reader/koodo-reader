import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingBook,
  handleRefreshBookCover,
  handleSelectBook,
  handleSelectedBooks,
  handleFetchBooks,
  handleCollectionDialogBooks,
  handleAddCollectionDialog,
} from "../../store/actions";
import BookCoverItem from "./component";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
    isCollapsed: state.sidebar.isCollapsed,
    currentBook: state.book.currentBook,
    isSelectBook: state.manager.isSelectBook,
    refreshBookKey: state.manager.refreshBookKey,
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
)(withTranslation()(withRouter(BookCoverItem as any) as any) as any);
