import {
  handleSelection,
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
  handleMessageBox,
  handleMessage,
  handleNoteKey,
} from "../../../store/actions";
import { connect } from "react-redux";
import { stateType } from "../../../store";
import PopupMenu from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    digests: state.reader.digests,
    notes: state.reader.notes,
    noteKey: state.reader.noteKey,
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    isOpenMenu: state.viewArea.isOpenMenu,
    menuMode: state.viewArea.menuMode,
    color: state.reader.color,
    isChangeDirection: state.viewArea.isChangeDirection,
  };
};
const actionCreator = {
  handleSelection,
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
  handleMessageBox,
  handleMessage,
  handleNoteKey,
};
export default connect(mapStateToProps, actionCreator)(PopupMenu);
