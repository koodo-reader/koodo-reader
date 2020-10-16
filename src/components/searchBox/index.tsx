import { connect } from "react-redux";
import { handleSearchResults, handleSearch } from "../../store/actions/manager";
import { stateType } from "../../store";
import { withNamespaces } from "react-i18next";
import SearchBox from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    notes: state.reader.notes,
    digests: state.reader.digests,
    isSearch: state.manager.isSearch,
    currentEpub: state.book.currentEpub,
    tabMode: state.sidebar.mode,
    shelfIndex: state.sidebar.shelfIndex,
  };
};
const actionCreator = {
  handleSearchResults,
  handleSearch,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(SearchBox as any));
