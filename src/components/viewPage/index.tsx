import { connect } from "react-redux";
import { handlePercentage } from "../../redux/actions/progressPanel";
import { stateType } from "../../redux/store";
import ViewPage from './component'
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    currentEpub: state.book.currentEpub,
    locations: state.progressPanel.locations,
  };
};
const actionCreator = {
  handlePercentage,
};
export default connect(mapStateToProps, actionCreator)(ViewPage);
