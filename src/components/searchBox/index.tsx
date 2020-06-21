import { connect } from "react-redux";
import { handleSearchBooks, handleSearch } from "../../redux/actions/manager";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import SearchBox from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    isSearch: state.manager.isSearch,
  };
};
const actionCreator = {
  handleSearchBooks,
  handleSearch,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(SearchBox as any));
