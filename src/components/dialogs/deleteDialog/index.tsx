import { connect } from "react-redux";
import {
  handleFetchBooks,
  handleDeleteDialog,
  handleActionDialog,
  handleFetchBookmarks,
  handleFetchNotes,
  handleSelectedBooks,
  handleSelectBook,
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
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
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
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(DeleteDialog as any) as any) as any);
