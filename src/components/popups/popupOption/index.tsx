import { connect } from "react-redux";
import {
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
  handlePopupOptionDialog,
  handlePopupOptionUpdate,
  handleSpeechDialog,
  handleSpeechStartText,
  handleSpeechAutoStart,
} from "../../../store/actions";
import {
  handleFetchNotes,
  handleOriginalText,
  handleOriginalSentence,
  handleNoteKey,
  handleQuoteText,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import PopupOption from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    selection: state.viewArea.selection,
    popupOptionUpdateIndex: state.backupPage.popupOptionUpdateIndex,

    color: state.reader.color,
    htmlBook: state.reader.htmlBook,
  };
};
const actionCreator = {
  handleOpenMenu,
  handleMenuMode,
  handleFetchNotes,
  handleOriginalText,
  handleOriginalSentence,
  handleChangeDirection,
  handleNoteKey,
  handlePopupOptionDialog,
  handlePopupOptionUpdate,
  handleSpeechDialog,
  handleSpeechStartText,
  handleSpeechAutoStart,
  handleQuoteText,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupOption as any) as any);
