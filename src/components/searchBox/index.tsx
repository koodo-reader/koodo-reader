import { connect } from "react-redux";
import { handleSearchResults, handleSearch } from "../../redux/actions/manager";
import { stateType } from "../../redux/store";
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
