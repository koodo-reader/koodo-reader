//全部图书，最近阅读，搜索结果，排序结果的数据
import { connect } from "react-redux";
import { handleFetchList } from "../../redux/actions/manager";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import BookList from "./component";

const mappropsToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    covers: state.manager.covers,
    epubs: state.manager.epubs,
    mode: state.sidebar.mode,
    shelfIndex: state.sidebar.shelfIndex,
    searchResults: state.manager.searchResults,
    isSearch: state.manager.isSearch,
    isSort: state.manager.isSort,
    isList: state.manager.isList,
    sortCode: state.manager.sortCode,
  };
};
const actionCreator = { handleFetchList };
export default connect(
  mappropsToProps,
  actionCreator
)(withNamespaces()(BookList as any));
