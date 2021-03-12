import { connect } from "react-redux";
import { stateType } from "../../../store";
import { withNamespaces } from "react-i18next";
import ProgressPanel from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    percentage: state.progressPanel.percentage,
    locations: state.progressPanel.locations,
    flattenChapters: state.reader.flattenChapters,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(ProgressPanel as any));
