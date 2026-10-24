import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import SettingPanel from "./component";
import { stateType } from "../../../store";
import {
  handleSettingLock,
  handleBackgroundColor,
} from "../../../store/actions";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    backgroundColor: state.reader.backgroundColor,
    isSettingLocked: state.reader.isSettingLocked,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = { handleSettingLock, handleBackgroundColor };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SettingPanel as any) as any);
