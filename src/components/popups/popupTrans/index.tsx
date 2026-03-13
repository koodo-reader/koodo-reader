import { connect } from "react-redux";
import {
  handleOpenMenu,
  handleMenuMode,
  handleFetchPlugins,
  handleSetting,
  handleSettingMode,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import PopupTrans from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    originalText: state.reader.originalText,
    plugins: state.manager.plugins,
    isAuthed: state.manager.isAuthed,
    noteKey: state.reader.noteKey,
  };
};
const actionCreator = {
  handleOpenMenu,
  handleMenuMode,
  handleFetchPlugins,
  handleSetting,
  handleSettingMode,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupTrans as any) as any);
