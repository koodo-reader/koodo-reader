//全部图书，最近阅读，搜索结果，排序结果的数据
import { connect } from "react-redux";
import {
  handleFetchList,
  handleFetchBooks,
} from "../../../store/actions/manager";
import { handleMode, handleShelfIndex } from "../../../store/actions/sidebar";
import { handleDeleteDialog } from "../../../store/actions/book";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import BookList from "./component";

const mappropsToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    mode: state.sidebar.mode,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,

    shelfIndex: state.sidebar.shelfIndex,
    isCollapsed: state.sidebar.isCollapsed,
    searchResults: state.manager.searchResults,
    isSearch: state.manager.isSearch,
    isBookSort: state.manager.isBookSort,
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
export default connect(
  mappropsToProps,
  actionCreator
)(withTranslation()(BookList as any));
