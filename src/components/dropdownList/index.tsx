//图书样式设置的下拉菜单页面
import { connect } from "react-redux";
import { withNamespaces } from "react-i18next";
import DropdownList from "./component";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import { stateType } from "../../redux/store";

const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(DropdownList as any));
