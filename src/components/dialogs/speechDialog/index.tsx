import { connect } from "react-redux";
import {
  handleSpeechDialog,
  handleFetchPlugins,
} from "../../../store/actions";
import { stateType } from "../../../store";
import SpeechDialog from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    plugins: state.manager.plugins,
    isSettingLocked: state.reader.isSettingLocked,
    isDockedRight: state.reader.isDockedRight,
  };
};
const actionCreator = {
  handleSpeechDialog,
  handleFetchPlugins,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SpeechDialog as any) as any);
