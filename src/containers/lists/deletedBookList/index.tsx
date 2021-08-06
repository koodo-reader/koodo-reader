import { connect } from "react-redux";
import {
  handleFetchList,
  handleFetchBooks,
  handleMode,
  handleShelfIndex,
  handleDeleteDialog,
} from "../../../store/actions";
import { stateType } from "../../../store";
import BookList from "./component";

const mappropsToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    deletedBooks: state.manager.deletedBooks,
    mode: state.sidebar.mode,
    isBookSort: state.manager.isBookSort,
    isCollapsed: state.sidebar.isCollapsed,
    viewMode: state.manager.viewMode,
    bookSortCode: state.manager.bookSortCode,
    noteSortCode: state.manager.noteSortCode,
  };
};
const actionCreator = {
  handleFetchList,
  handleMode,
  handleShelfIndex,
  handleDeleteDialog,
  handleFetchBooks,
};
export default connect(mappropsToProps, actionCreator)(BookList);
