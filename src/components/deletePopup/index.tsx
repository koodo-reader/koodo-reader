import { connect } from "react-redux";
import {
  handleFetchBooks,
  handleMessageBox,
  handleMessage,
} from "../../redux/actions/manager";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import DeletePopup from "./component";

const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = {
  handleFetchBooks,
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(DeletePopup as any));
