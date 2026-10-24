import { connect } from "react-redux";
import {
  handleFetchBooks,
  handleLoadMore,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import BookList from "./component";

const mappropsToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    mode: state.sidebar.mode,

    selectedBooks: state.manager.selectedBooks,
    shelfTitle: state.sidebar.shelfTitle,
    isCollapsed: state.sidebar.isCollapsed,
    searchResults: state.manager.searchResults,
    isSearch: state.manager.isSearch,
    isSelectBook: state.manager.isSelectBook,
    viewMode: state.manager.viewMode,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleLoadMore,
};
export default connect(
  mappropsToProps,
  actionCreator
)(withTranslation()(BookList as any) as any);
