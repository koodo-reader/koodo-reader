//字体大小选择页面
import { connect } from "react-redux";
import { withNamespaces } from "react-i18next";
import FontSizeList from "./component";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import { stateType } from "../../redux/store";

const mapStateToProps = (state: stateType) => {
  return { currentEpub: state.book.currentEpub };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(FontSizeList as any));
