import { connect } from "react-redux";
import {
  handleReadingBook,
  handleActionDialog,
  handleSelectBook,
  handleSelectedBooks,
  handleFetchBooks,
  handleCollectionDialog,
  handleCollectionDialogMode,
  handleCollectionDialogBooks,
  handleCollectionDialogKey,
  handleCollectionDetailDialog,
  handleCurrentCollectionKey,
} from "../../store/actions";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";
import CollectionItem from "./component";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
    currentBook: state.book.currentBook,
    isSelectBook: state.manager.isSelectBook,
    selectedBooks: state.manager.selectedBooks,
    refreshBookKey: state.manager.refreshBookKey,
    isCollapsed: state.sidebar.isCollapsed,
  };
};
const actionCreator = {
  handleReadingBook,
  handleActionDialog,
  handleSelectBook,
  handleSelectedBooks,
  handleFetchBooks,
  handleCollectionDialog,
  handleCollectionDialogMode,
  handleCollectionDialogBooks,
  handleCollectionDialogKey,
  handleCollectionDetailDialog,
  handleCurrentCollectionKey,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(CollectionItem as any) as any) as any);
