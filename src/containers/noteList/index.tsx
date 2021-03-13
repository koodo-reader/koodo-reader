//我的笔记页面
import { connect } from "react-redux";
import { stateType } from "../../store";
import { withNamespaces } from "react-i18next";
import NoteList from "./component";
import { handleFetchNotes } from "../../store/actions/reader";

const mapStateToProps = (state: stateType) => {
  return {
    notes: state.reader.notes,
    isSearch: state.manager.isSearch,
    isCollapsed: state.sidebar.isCollapsed,
    searchResults: state.manager.searchResults,
  };
};
const actionCreator = { handleFetchNotes };
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(NoteList as any));
