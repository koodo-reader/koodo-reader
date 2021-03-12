//编辑图书对话框
import { connect } from "react-redux";
import "./editDialog.css";
import {
  handleFetchBooks,
  handleMessageBox,
  handleMessage,
} from "../../../store/actions/manager";
import {
  handleEditDialog,
  handleActionDialog,
} from "../../../store/actions/book";
import { stateType } from "../../../store";
import { withNamespaces } from "react-i18next";
import EditDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    digests: state.reader.digests,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleEditDialog,
  handleActionDialog,
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(EditDialog as any));
