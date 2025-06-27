import { connect } from "react-redux";
import { stateType } from "../../../store";
import NoteList from "./component";
import { handleFetchNotes } from "../../../store/actions";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    notes: state.reader.notes,
    books: state.manager.books,
    isSearch: state.manager.isSearch,
    isCollapsed: state.sidebar.isCollapsed,
    searchResults: state.manager.searchResults,
    tabMode: state.sidebar.mode,
  };
};
const actionCreator = { handleFetchNotes };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(NoteList) as any);
