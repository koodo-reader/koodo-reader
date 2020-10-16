//添加图书到书架的对话框
import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../store/actions/manager";
import { handleTokenDialog } from "../../store/actions/backupPage";
import { stateType } from "../../store";
import { withNamespaces } from "react-i18next";
import TokenDialog from "./component";
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
  handleTokenDialog,
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(TokenDialog as any));
