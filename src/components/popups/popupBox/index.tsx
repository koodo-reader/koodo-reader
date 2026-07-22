import {
  handleSelection,
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
  handleNoteKey,
  handleRenderNoteFunc,
  handleDockedRight,
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
    isDockedRight: state.reader.isDockedRight,
    isChangeDirection: state.viewArea.isChangeDirection,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = {
  handleSelection,
  handleOpenMenu,
  handleMenuMode,
  handleChangeDirection,
  handleNoteKey,
  handleRenderNoteFunc,
  handleDockedRight,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupBox as any) as any);
