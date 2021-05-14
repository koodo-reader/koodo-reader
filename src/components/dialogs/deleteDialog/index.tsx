import { connect } from "react-redux";
import {
  handleFetchBooks,
  handleMessageBox,
  handleMessage,
} from "../../../store/actions/manager";
import {
  handleDeleteDialog,
  handleActionDialog,
} from "../../../store/actions/book";
import {
  handleFetchBookmarks,
  handleFetchNotes,
} from "../../../store/actions/reader";
import { stateType } from "../../../store";
import DeleteDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    digests: state.reader.digests,
    mode: state.sidebar.mode,
    shelfIndex: state.sidebar.shelfIndex,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleDeleteDialog,
  handleFetchBookmarks,
  handleFetchNotes,
  handleMessageBox,
  handleMessage,
  handleActionDialog,
};
export default connect(mapStateToProps, actionCreator)(DeleteDialog);
