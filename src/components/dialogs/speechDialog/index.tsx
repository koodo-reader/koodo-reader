import { connect } from "react-redux";
import {
  handleSetting,
  handleSpeechDialog,
  handleFetchPlugins,
} from "../../../store/actions";
import { stateType } from "../../../store";
import SpeechDialog from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    isSpeechOpen: state.reader.isSpeechOpen,
    plugins: state.manager.plugins,
    isAuthed: state.manager.isAuthed,
    currentBook: state.book.currentBook,
    isSettingLocked: state.reader.isSettingLocked,
  };
};
const actionCreator = {
  handleSetting,
  handleSpeechDialog,
  handleFetchPlugins,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SpeechDialog as any) as any);
