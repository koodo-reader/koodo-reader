import { connect } from "react-redux";
import { stateType } from "../../redux/store";
import ViewArea from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(ViewArea);
