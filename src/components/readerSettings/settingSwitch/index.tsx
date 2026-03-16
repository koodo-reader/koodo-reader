import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import SettingSwitch from "./component";
import { stateType } from "../../../store";
import {
  handleHideFooter,
  handleHideHeader,
  handleHideAIButton,
  handleHideBackground,
  handleHideMenuButton,
  handleHideAudiobookButton,
  handleHidePageButton,
  handleHidePDFConvertButton,
  handleHideScaleButton,
} from "../../../store/actions";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    renderBookFunc: state.book.renderBookFunc,
    plugins: state.manager.plugins,
  };
};
const actionCreator = {
  handleHideFooter,
  handleHideHeader,
  handleHideBackground,
  handleHidePageButton,
  handleHideMenuButton,
  handleHideAudiobookButton,
  handleHideAIButton,
  handleHideScaleButton,
  handleHidePDFConvertButton,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SettingSwitch as any) as any);
