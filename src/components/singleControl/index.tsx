//单双页切换
import { handleSingle } from "../../redux/actions/reader";
import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import { withNamespaces } from "react-i18next";
import SingleControl from './component'
const actionCreator = { handleSingle, handleMessageBox, handleMessage };
export default connect(
  null,
  actionCreator
)(withNamespaces()(SingleControl as any));
