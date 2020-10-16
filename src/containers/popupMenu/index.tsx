//弹出菜单
import {
  handleSelection,
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
} from "../../store/actions/viewArea";
import { connect } from "react-redux";
import { stateType } from "../../store";
import { handleMessageBox, handleMessage } from "../../store/actions/manager";
import { handleNoteKey } from "../../store/actions/reader";
import PopupMenu from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    digests: state.reader.digests,
    notes: state.reader.notes,
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
