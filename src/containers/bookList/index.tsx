//全部图书，最近阅读，搜索结果，排序结果的数据
import { connect } from "react-redux";
import { handleFetchList } from "../../store/actions/manager";
import { handleMode, handleShelfIndex } from "../../store/actions/sidebar";

import { stateType } from "../../store";
import { withNamespaces } from "react-i18next";
import BookList from "./component";

const mappropsToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    mode: state.sidebar.mode,
    shelfIndex: state.sidebar.shelfIndex,
    searchResults: state.manager.searchResults,
    isSearch: state.manager.isSearch,
    isSort: state.manager.isSort,
    isList: state.manager.isList,
    sortCode: state.manager.sortCode,
  };
};
const actionCreator = { handleFetchList, handleMode, handleShelfIndex };
export default connect(
  mappropsToProps,
  actionCreator
)(withNamespaces()(BookList as any));
