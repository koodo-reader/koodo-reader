//左下角的图标外链
import { connect } from "react-redux";
import { handleTipDialog } from "../../../store/actions/manager";
import TipDialog from "./component";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = {
  handleTipDialog,
};
export default connect(mapStateToProps, actionCreator)(TipDialog);
