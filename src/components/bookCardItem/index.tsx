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
import { withTranslation } from "react-i18next";
import BookCardItem from "./component";
import { stateType } from "../../store";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
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
)(withTranslation()(withRouter(BookCardItem as any) as any) as any);
