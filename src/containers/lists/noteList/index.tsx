import { connect } from "react-redux";
import { stateType } from "../../../store";
import NoteList from "./component";
import { handleFetchNotes } from "../../../store/actions";

const mapStateToProps = (state: stateType) => {
  return {
    notes: state.reader.notes,
    isSearch: state.manager.isSearch,
    isCollapsed: state.sidebar.isCollapsed,
    searchResults: state.manager.searchResults,
  };
};
const actionCreator = { handleFetchNotes };
export default connect(mapStateToProps, actionCreator)(NoteList);
