//左下角的图标外链
import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import UpdateInfo from "./component";
import { withNamespaces } from "react-i18next";

const actionCreator = { handleMessageBox, handleMessage };
export default connect(
  null,
  actionCreator
)(withNamespaces()(UpdateInfo as any));
