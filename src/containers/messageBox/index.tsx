//消息提示
import { connect } from "react-redux";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import MessageBox from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    message: state.manager.message,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(MessageBox as any));
