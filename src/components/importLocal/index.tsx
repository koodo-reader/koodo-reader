import "./importLocal.css";
import { connect } from "react-redux";
import { handleFetchBooks, handleLoadingDialog } from "../../store/actions";
import { handleReadingBook } from "../../store/actions";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";
import ImportLocal from "./component";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    notes: state.reader.notes,
    bookmarks: state.reader.bookmarks,
    isCollapsed: state.sidebar.isCollapsed,
    deletedBooks: state.manager.deletedBooks,
    mode: state.sidebar.mode,
    shelfTitle: state.sidebar.shelfTitle,
    isAuthed: state.manager.isAuthed,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleReadingBook,
  handleLoadingDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(ImportLocal as any) as any) as any);
