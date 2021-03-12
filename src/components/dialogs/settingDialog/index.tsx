//左下角的图标外链
import { connect } from "react-redux";
import SettingDialog from "./component";
import { withNamespaces } from "react-i18next";
import {
  handleSetting,
  handleMessageBox,
  handleMessage,
} from "../../../store/actions/manager";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = { handleSetting, handleMessageBox, handleMessage };
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(SettingDialog as any));
