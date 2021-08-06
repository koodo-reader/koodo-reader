import { connect } from "react-redux";
import { handleTipDialog } from "../../../store/actions";
import TipDialog from "./component";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return { tip: state.manager.tip };
};
const actionCreator = {
  handleTipDialog,
};
export default connect(mapStateToProps, actionCreator)(TipDialog);
