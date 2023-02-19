import { connect } from "react-redux";
import {
  handleOpenMenu,
  handleMenuMode,
  handleNoteKey,
  handleFetchNotes,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import PopupNote from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    notes: state.reader.notes,
    color: state.reader.color,
    noteKey: state.reader.noteKey,
  };
};
const actionCreator = {
  handleOpenMenu,
  handleMenuMode,
  handleNoteKey,
  handleFetchNotes,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupNote as any) as any);
