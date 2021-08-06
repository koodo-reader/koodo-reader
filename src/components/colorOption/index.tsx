import { connect } from "react-redux";
import { handleColor, handleSelection } from "../../store/actions";
import { stateType } from "../../store";
import About from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    color: state.reader.color,
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
  };
};
const actionCreator = {
  handleColor,
  handleSelection,
};
export default connect(mapStateToProps, actionCreator)(About);
