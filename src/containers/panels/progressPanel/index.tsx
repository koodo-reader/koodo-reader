import { connect } from "react-redux";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import ProgressPanel from "./component";
import { handleFetchPercentage } from "../../../store/actions/progressPanel";
const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    percentage: state.progressPanel.percentage,
    locations: state.progressPanel.locations,
    flattenChapters: state.reader.flattenChapters,
  };
};
const actionCreator = { handleFetchPercentage };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ProgressPanel as any));
