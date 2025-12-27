import { connect } from "react-redux";
import { handleColor, handleSelection } from "../../store/actions";
import { stateType } from "../../store";
import ColorOption from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    color: state.reader.color,
  };
};
const actionCreator = {
  handleColor,
  handleSelection,
};
export default connect(mapStateToProps, actionCreator)(ColorOption as any);
