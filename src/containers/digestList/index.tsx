//我的书摘页面
import { connect } from "react-redux";
import { stateType } from "../../store";
import { withNamespaces } from "react-i18next";
import DigestList from "./component";
import { handleFetchNotes } from "../../store/actions/reader";

const mapStateToProps = (state: stateType) => {
  return {
    digests: state.reader.digests,
    isSearch: state.manager.isSearch,
    searchResults: state.manager.searchResults,
  };
};
const actionCreator = { handleFetchNotes };
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(DigestList as any));
