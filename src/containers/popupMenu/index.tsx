//弹出菜单
import {
  handleSelection,
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
} from "../../redux/actions/viewArea";
import { connect } from "react-redux";
import { stateType } from "../../redux/store";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import PopupMenu from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    highlighters: state.reader.highlighters,
    isOpenMenu: state.viewArea.isOpenMenu,
    menuMode: state.viewArea.menuMode,
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
};
export default connect(mapStateToProps, actionCreator)(PopupMenu);
