//我的笔记页面
import { connect } from "react-redux";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import NoteList from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    notes: state.reader.notes,
    isSearch: state.manager.isSearch,
    searchResults: state.manager.searchResults,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(NoteList as any));
