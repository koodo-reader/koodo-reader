import { connect } from "react-redux";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import ProgressPanel from "./component";
import { handleFetchPercentage } from "../../../store/actions";
const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    isReading: state.book.isReading,
    percentage: state.progressPanel.percentage,
    currentChapter: state.reader.currentChapter,
    htmlBook: state.reader.htmlBook,
    renderFunc: state.book.renderFunc,
  };
};
const actionCreator = { handleFetchPercentage };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ProgressPanel as any));
