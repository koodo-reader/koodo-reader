import { connect } from "react-redux";
import {
  handleFetchBooks,
  handleDeleteDialog,
  handleActionDialog,
  handleFetchBookmarks,
  handleFetchNotes,
  handleSelectedBooks,
  handleSelectBook,
  handleSearch,
} from "../../../store/actions";
import { stateType } from "../../../store";
import DeleteDialog from "./component";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    selectedBooks: state.manager.selectedBooks,
    isSelectBook: state.manager.isSelectBook,
    isSearch: state.manager.isSearch,
    searchResults: state.manager.searchResults,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    currentBook: state.book.currentBook,

    deletedBooks: state.manager.deletedBooks,
    mode: state.sidebar.mode,
    shelfTitle: state.sidebar.shelfTitle,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleDeleteDialog,
  handleFetchBookmarks,
  handleFetchNotes,
  handleActionDialog,
  handleSelectedBooks,
  handleSelectBook,
  handleSearch,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(DeleteDialog as any) as any) as any);
