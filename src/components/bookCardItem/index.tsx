import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingBook,
  handleDeleteDialog,
  handleSelectBook,
  handleSelectedBooks,
  handleRefreshBookCover,
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
    selectedBooks: state.manager.selectedBooks,
    refreshBookKey: state.manager.refreshBookKey,
  };
};
const actionCreator = {
  handleReadingBook,
  handleActionDialog,
  handleSelectBook,
  handleDeleteDialog,
  handleSelectedBooks,
  handleRefreshBookCover,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(BookCardItem as any) as any) as any);
