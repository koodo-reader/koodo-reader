import { connect } from "react-redux";
import { stateType } from "../../redux/store";
import ViewArea from "./component";
import { handleFetchLocations } from "../../redux/actions/progressPanel";

const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub
  };
};
const actionCreator = {handleFetchLocations};
export default connect(mapStateToProps, actionCreator)(ViewArea);
