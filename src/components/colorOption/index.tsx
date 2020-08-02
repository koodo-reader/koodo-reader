//左下角的图标外链
import { connect } from "react-redux";
import { handleColor } from "../../redux/actions/reader";
import { stateType } from "../../redux/store";
import About from "./component";
import { handleSelection } from "../../redux/actions/viewArea";
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
