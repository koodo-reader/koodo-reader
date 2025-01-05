import { connect } from "react-redux";
import {
  handleFetchList,
  handleFetchBooks,
  handleMode,
  handleShelf,
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
    isSelectBook: state.manager.isSelectBook,

    selectedBooks: state.manager.selectedBooks,
  };
};
const actionCreator = {
  handleFetchList,
  handleMode,
  handleShelf,
  handleDeleteDialog,
  handleFetchBooks,
};
export default connect(mappropsToProps, actionCreator)(BookList);
