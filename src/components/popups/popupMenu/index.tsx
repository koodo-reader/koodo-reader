import {
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
  handleNoteKey,
  handleOriginalText,
  handleOriginalSentence,
  handleFetchNotes,
} from "../../../store/actions";
import { connect } from "../../../store/legacyConnect";
import { stateType } from "../../../store";
import PopupMenu from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    isOpenMenu: state.viewArea.isOpenMenu,
    menuMode: state.viewArea.menuMode,
    readerMode: state.reader.readerMode,
    highlight: state.reader.highlight,
    htmlBook: state.reader.htmlBook,
  };
};
const actionCreator = {
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
  handleNoteKey,
  handleOriginalText,
  handleOriginalSentence,
  handleFetchNotes,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupMenu as any) as any);
