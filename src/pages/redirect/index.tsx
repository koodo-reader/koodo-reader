import { connect } from "react-redux";
import "./manager.css";
import { stateType } from "../../store";
import {
  handleMessageBox,
  handleMessage,
  handleLoadingDialog,
} from "../../store/actions/manager";
import Redirect from "./component";
const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = { handleMessageBox, handleMessage, handleLoadingDialog };
export default connect(mapStateToProps, actionCreator)(Redirect);
