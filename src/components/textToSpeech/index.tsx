import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import TextToSpeech from "./component";
import { stateType } from "../../store";
import {
  handleFetchPlugins,
  handleSetting,
  handleSettingMode,
  handleSpeechStartText,
  handleSpeechAutoStart,
} from "../../store/actions";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    htmlBook: state.reader.htmlBook,
    isReading: state.book.isReading,
    plugins: state.manager.plugins,
    readerMode: state.reader.readerMode,
    isAuthed: state.manager.isAuthed,
    speechStartText: state.reader.speechStartText,
    isSpeechAutoStart: state.reader.isSpeechAutoStart,
  };
};
const actionCreator = {
  handleFetchPlugins,
  handleSetting,
  handleSettingMode,
  handleSpeechStartText,
  handleSpeechAutoStart,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(TextToSpeech as any) as any);
