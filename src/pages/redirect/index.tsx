import { connect } from "react-redux";
import "./manager.css";
import { stateType } from "../../store";
import { handleLoadingDialog } from "../../store/actions";
import Redirect from "./component";
const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = { handleLoadingDialog };
export default connect(mapStateToProps, actionCreator)(Redirect);
