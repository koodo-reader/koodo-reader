import { connect } from "../../../store/legacyConnect";
import { withTranslation } from "react-i18next";
import AssistReadDialog from "./component";
import { stateType } from "../../../store";
import {
  handleAssistReadDialog,
  handleParagraphMode,
  handleReadingRuler,
  handleSpeedReading,
  handleAutoReading,
  handleReaderMode,
} from "../../../store/actions";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    htmlBook: state.reader.htmlBook,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = {
  handleAssistReadDialog,
  handleParagraphMode,
  handleReadingRuler,
  handleSpeedReading,
  handleAutoReading,
  handleReaderMode,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(AssistReadDialog as any) as any);
