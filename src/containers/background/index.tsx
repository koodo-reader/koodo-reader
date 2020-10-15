//图书下面的背景，包括页边和书脊
import { connect } from "react-redux";
import { stateType } from "../../redux/store";
import Background from "./component";
import { handleFetchLocations } from "../../redux/actions/progressPanel";

const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    flattenChapters: state.reader.flattenChapters,
    locations: state.progressPanel.locations,
  };
};
const actionCreator = { handleFetchLocations };
export default connect(mapStateToProps, actionCreator)(Background);
