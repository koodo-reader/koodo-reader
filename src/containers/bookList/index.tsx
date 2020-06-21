//全部图书，最近阅读，搜索结果，排序结果的数据
import { connect } from "react-redux";
import { handleFetchList } from "../../redux/actions/manager";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import BookList from "./component";

const mappropsToProps = (props: stateType) => {
  return {
    books: props.manager.books,
    covers: props.manager.covers,
    epubs: props.manager.epubs,
    mode: props.sidebar.mode,
    shelfIndex: props.sidebar.shelfIndex,
    searchBooks: props.manager.searchBooks,
    isSearch: props.manager.isSearch,
    isSort: props.manager.isSort,
    isList: props.manager.isList,
    sortCode: props.manager.sortCode,
  };
};
const actionCreator = { handleFetchList };
export default connect(
  mappropsToProps,
  actionCreator
)(withNamespaces()(BookList as any));
