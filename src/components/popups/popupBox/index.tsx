import {
  handleOpenMenu,
  handleMenuMode,
  handleNoteKey,
  handleDockedRight,
} from "../../../store/actions";
import { connect } from "react-redux";
import { stateType } from "../../../store";
import PopupBox from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    menuMode: state.viewArea.menuMode,
    isNavLocked: state.reader.isNavLocked,
    isSettingLocked: state.reader.isSettingLocked,
    isDockedRight: state.reader.isDockedRight,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = {
  handleOpenMenu,
  handleMenuMode,
  handleNoteKey,
  handleDockedRight,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupBox as any) as any);
