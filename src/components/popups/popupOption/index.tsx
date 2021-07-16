import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../../store/actions";
import {
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
} from "../../../store/actions";
import { handleFetchNotes, handleOriginalText } from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import PopupOption from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    currentEpub: state.book.currentEpub,
    selection: state.viewArea.selection,
    notes: state.reader.notes,
    color: state.reader.color,
    flattenChapters: state.reader.flattenChapters,
  };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
  handleOpenMenu,
  handleMenuMode,
  handleFetchNotes,
  handleOriginalText,
  handleChangeDirection,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupOption as any));
