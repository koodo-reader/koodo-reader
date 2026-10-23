import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import SettingSwitch from "./component";
import { stateType } from "../../../store";
import {
  handleHideFooter,
  handleHideHeader,
  handleHideBackground,
  handleShowBorder,
  handleBackgroundColor,
} from "../../../store/actions";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = {
  handleHideFooter,
  handleHideHeader,
  handleHideBackground,
  handleShowBorder,
  handleBackgroundColor,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SettingSwitch as any) as any);
