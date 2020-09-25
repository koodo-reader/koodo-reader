//单双页切换
import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import { withNamespaces } from "react-i18next";
import ModeControl from "./component";
import { stateType } from "../../redux/store";

const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = { handleMessageBox, handleMessage };
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(ModeControl as any));
