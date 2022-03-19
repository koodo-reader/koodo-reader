import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import TextToSpeech from "./component";
import { stateType } from "../../store";

const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    htmlBook: state.reader.htmlBook,
    locations: state.progressPanel.locations,
    isReading: state.book.isReading,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(TextToSpeech as any));
