import { connect } from "react-redux";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import { handleFetchPercentage } from "../../../store/actions";
import ProgressPanel from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    isReading: state.book.isReading,
    percentage: state.progressPanel.percentage,
    htmlBook: state.reader.htmlBook,
    readerMode: state.reader.readerMode,
    currentChapterIndex: state.reader.currentChapterIndex,
    currentChapter: state.reader.currentChapter,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = { handleFetchPercentage };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ProgressPanel as any) as any);
