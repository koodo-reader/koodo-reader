//图书下面的背景，包括页边和书脊
import { connect } from "react-redux";
import { stateType } from "../../redux/store";
import Background from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    isSingle: state.reader.isSingle,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(Background);
