import { connect } from "react-redux";
import {
  handleOpenMenu,
  handleMenuMode,
  handleNoteKey,
  handleFetchNotes,
  handleShowPopupNote,
  handleColor,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import PopupNote from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,

    color: state.reader.color,
    htmlBook: state.reader.htmlBook,
    noteKey: state.reader.noteKey,
  };
};
const actionCreator = {
  handleOpenMenu,
  handleMenuMode,
  handleNoteKey,
  handleFetchNotes,
  handleShowPopupNote,
  handleColor,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupNote as any) as any);
