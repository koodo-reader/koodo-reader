import { connect } from "../../store/legacyConnect";
import { handleHighlight } from "../../store/actions";
import { stateType } from "../../store";
import ColorOption from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    highlight: state.reader.highlight,
  };
};
const actionCreator = {
  handleHighlight,
};
export default connect(mapStateToProps, actionCreator)(ColorOption as any);
