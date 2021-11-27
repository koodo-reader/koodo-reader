import { connect } from "react-redux";
import { stateType } from "../../store";
import Background from "./component";
import { handleFetchLocations } from "../../store/actions";

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
