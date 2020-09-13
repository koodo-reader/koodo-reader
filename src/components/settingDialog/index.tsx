//左下角的图标外链
import { connect } from "react-redux";
import SettingDialog from "./component";
import { withNamespaces } from "react-i18next";
import {
  handleSetting,
  handleMessageBox,
  handleMessage,
} from "../../redux/actions/manager";
import { stateType } from "../../redux/store";

const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = { handleSetting, handleMessageBox, handleMessage };
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(SettingDialog as any));
