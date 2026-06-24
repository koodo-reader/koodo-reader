import { connect } from "react-redux";
import { handleHighlight, handleSelection } from "../../store/actions";
import { stateType } from "../../store";
import ColorOption from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    highlight: state.reader.highlight,
  };
};
const actionCreator = {
  handleHighlight,
  handleSelection,
};
export default connect(mapStateToProps, actionCreator)(ColorOption as any);
