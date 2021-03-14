import { withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import TextToSpeech from "./component";
import { stateType } from "../../store";
import { handleMessageBox, handleMessage } from "../../store/actions/manager";

const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    locations: state.progressPanel.locations,
    isReading: state.book.isReading,
  };
};
const actionCreator = { handleMessageBox, handleMessage };
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(TextToSpeech as any));
