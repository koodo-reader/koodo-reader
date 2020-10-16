import { connect } from "react-redux";
import { stateType } from "../../store";
import ImageViewer from "./component";

const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = {};

export default connect(mapStateToProps, actionCreator)(ImageViewer);
