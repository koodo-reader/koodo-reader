import { connect } from "react-redux";
import {
  handleFetchBooks,
  handleMode,
  handleShelf,
  handleDeleteDialog,
} from "../../../store/actions";
import { stateType } from "../../../store";
import BookList from "./component";

const mappropsToProps = (state: stateType) => {
  return {
    deletedBooks: state.manager.deletedBooks,
    mode: state.sidebar.mode,

    isCollapsed: state.sidebar.isCollapsed,
    viewMode: state.manager.viewMode,
    bookSortCode: state.manager.bookSortCode,
    noteSortCode: state.manager.noteSortCode,
    isSelectBook: state.manager.isSelectBook,

    selectedBooks: state.manager.selectedBooks,
  };
};
const actionCreator = {
  handleMode,
  handleShelf,
  handleDeleteDialog,
  handleFetchBooks,
};
export default connect(mappropsToProps, actionCreator)(BookList);
