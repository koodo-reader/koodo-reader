import { connect } from "react-redux";
import { stateType } from "../../store";
import Background from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(Background);
