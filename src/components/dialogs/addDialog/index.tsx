import { connect } from "react-redux";
import {
  handleMessageBox,
  handleMessage,
  handleAddDialog,
  handleActionDialog,
  handleMode,
  handleShelfIndex,
  handleSelectedBooks,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import AddDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    selectedBooks: state.manager.selectedBooks,
    isSelectBook: state.manager.isSelectBook,
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
  handleSelectedBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(AddDialog as any));
