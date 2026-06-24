import { connect } from "react-redux";
import {
  handleOpenMenu,
  handleMenuMode,
  handleNoteKey,
  handleFetchNotes,
  handleShowPopupNote,
  handleHighlight,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import PopupNote from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,

    highlight: state.reader.highlight,
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
  handleHighlight,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupNote as any) as any);
