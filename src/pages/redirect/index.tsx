import { connect } from "react-redux";
import "./manager.css";
import { stateType } from "../../store";
import Redirect from "./component";
const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(Redirect);
