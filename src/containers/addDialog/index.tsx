//添加图书到书架的对话框
import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import { handleAddDialog } from "../../redux/actions/book";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import AddDialog from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    digests: state.reader.digests,
    highlighters: state.reader.highlighters,
  };
};
const actionCreator = {
  handleAddDialog,
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(AddDialog as any));
