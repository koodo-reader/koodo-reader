//添加图书到书架的对话框
import { connect } from "react-redux";
import {
  handleMessageBox,
  handleMessage,
  handleAddDialog,
  handleActionDialog,
  handleMode,
  handleShelfIndex,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import AddDialog from "./component";

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
  handleAddDialog,
  handleActionDialog,
  handleMessageBox,
  handleMessage,
  handleMode,
  handleShelfIndex,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(AddDialog as any));
