//单双页切换
import { connect } from "react-redux";
import {
  handleMessageBox,
  handleMessage,
} from "../../../store/actions/manager";
import { withTranslation } from "react-i18next";
import ModeControl from "./component";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = { handleMessageBox, handleMessage };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ModeControl as any));
