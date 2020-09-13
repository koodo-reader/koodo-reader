//header 页面
import { connect } from "react-redux";
import { withNamespaces } from "react-i18next";
import {
  handleSortDisplay,
  handleMessageBox,
  handleMessage,
  handleSetting,
} from "../../redux/actions/manager";
import { handleBackupDialog } from "../../redux/actions/backupPage";
import { stateType } from "../../redux/store";
import Header from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    isSearch: state.manager.isSearch,
    isSortDisplay: state.manager.isSortDisplay,
  };
};
const actionCreator = {
  handleSortDisplay,
  handleMessageBox,
  handleMessage,
  handleBackupDialog,
  handleSetting,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(Header as any));
