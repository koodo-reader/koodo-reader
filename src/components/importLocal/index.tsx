import "./importLocal.css";
import { connect } from "react-redux";
import {
  handleMessageBox,
  handleMessage,
  handleFetchBooks,
  handleLoadingDialog,
} from "../../store/actions";
import { handleReadingBook } from "../../store/actions";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";
import ImportLocal from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    notes: state.reader.notes,
    bookmarks: state.reader.bookmarks,
    isCollapsed: state.sidebar.isCollapsed,
    deletedBooks: state.manager.deletedBooks,
  };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
  handleFetchBooks,
  handleReadingBook,
  handleLoadingDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ImportLocal as any));
