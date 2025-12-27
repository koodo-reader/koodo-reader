import {
  handleSelection,
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
  handleNoteKey,
  handleRenderNoteFunc,
} from "../../../store/actions";
import { connect } from "react-redux";
import { stateType } from "../../../store";
import PopupBox from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    noteKey: state.reader.noteKey,
    currentBook: state.book.currentBook,
    isOpenMenu: state.viewArea.isOpenMenu,
    menuMode: state.viewArea.menuMode,
    isNavLocked: state.reader.isNavLocked,
    isSettingLocked: state.reader.isSettingLocked,
    color: state.reader.color,
    isChangeDirection: state.viewArea.isChangeDirection,
  };
};
const actionCreator = {
  handleSelection,
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
  handleNoteKey,
  handleRenderNoteFunc,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupBox as any) as any);
