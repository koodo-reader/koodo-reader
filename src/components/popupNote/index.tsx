import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import { handleOpenMenu, handleMenuMode } from "../../redux/actions/viewArea";
import { handleNoteKey, handleFetchNotes } from "../../redux/actions/reader";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import PopupNote from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    notes: state.reader.notes,
    color: state.reader.color,
    chapters: state.reader.chapters,
    noteKey: state.reader.noteKey,
  };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
  handleOpenMenu,
  handleMenuMode,
  handleNoteKey,
  handleFetchNotes,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(PopupNote as any));
