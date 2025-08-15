import { connect } from "react-redux";
import { handleSearchResults, handleSearch } from "../../store/actions";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";
import NoteTag from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    isReading: state.book.isReading,
    noteKey: state.reader.noteKey,
    isShowPopupNote: state.manager.isShowPopupNote,
  };
};
const actionCreator = {
  handleSearchResults,
  handleSearch,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(NoteTag as any) as any);
