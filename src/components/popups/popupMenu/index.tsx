import {
  handleSelection,
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
  handleNoteKey,
  handleRenderNoteFunc,
  handleOriginalText,
  handleOriginalSentence,
} from "../../../store/actions";
import { connect } from "react-redux";
import { stateType } from "../../../store";
import PopupMenu from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    noteKey: state.reader.noteKey,
    currentBook: state.book.currentBook,
    isOpenMenu: state.viewArea.isOpenMenu,
    menuMode: state.viewArea.menuMode,
    readerMode: state.reader.readerMode,
    color: state.reader.color,
    isChangeDirection: state.viewArea.isChangeDirection,
    htmlBook: state.reader.htmlBook,
  };
};
const actionCreator = {
  handleSelection,
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
  handleNoteKey,
  handleRenderNoteFunc,
  handleOriginalText,
  handleOriginalSentence,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupMenu as any) as any);
