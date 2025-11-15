import { connect } from "react-redux";
import {
  handleFetchList,
  handleFetchBooks,
  handleMode,
  handleShelf,
  handleDeleteDialog,
  handleLoadMore,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import BookList from "./component";

const mappropsToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    mode: state.sidebar.mode,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    selectedBooks: state.manager.selectedBooks,
    shelfTitle: state.sidebar.shelfTitle,
    isCollapsed: state.sidebar.isCollapsed,
    searchResults: state.manager.searchResults,
    isSearch: state.manager.isSearch,
    isSelectBook: state.manager.isSelectBook,
    isBookSort: state.manager.isBookSort,
    viewMode: state.manager.viewMode,
    bookSortCode: state.manager.bookSortCode,
    noteSortCode: state.manager.noteSortCode,
  };
};
const actionCreator = {
  handleFetchList,
  handleMode,
  handleShelf,
  handleFetchBooks,
  handleDeleteDialog,
  handleLoadMore,
};
export default connect(
  mappropsToProps,
  actionCreator
)(withTranslation()(BookList as any) as any);
