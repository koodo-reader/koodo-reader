import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import { handleOpenMenu, handleMenuMode } from "../../redux/actions/viewArea";
import {
  handleFetchNotes,
  handleOriginalText,
} from "../../redux/actions/reader";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import PopupOption from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    currentEpub: state.book.currentEpub,
    selection: state.viewArea.selection,
    notes: state.reader.notes,
    color: state.reader.color,
    chapters: state.reader.chapters,
  };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
  handleOpenMenu,
  handleMenuMode,
  handleFetchNotes,
  handleOriginalText,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(PopupOption as any));
