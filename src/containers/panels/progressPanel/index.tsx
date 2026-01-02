import { connect } from "react-redux";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import {
  handleFetchPercentage,
  handleCurrentChapter,
} from "../../../store/actions";
import ProgressPanel from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    percentage: state.progressPanel.percentage,
    htmlBook: state.reader.htmlBook,
    readerMode: state.reader.readerMode,
    currentChapterIndex: state.reader.currentChapterIndex,
    currentChapter: state.reader.currentChapter,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = { handleFetchPercentage, handleCurrentChapter };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ProgressPanel as any) as any);
