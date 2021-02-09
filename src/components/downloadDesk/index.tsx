//左下角的图标外链
import { connect } from "react-redux";
import { handleDownloadDesk } from "../../store/actions/manager";
import DownloadDesk from "./component";
import { withNamespaces } from "react-i18next";
import { stateType } from "../../store";

const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = {
  handleDownloadDesk,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(DownloadDesk as any));
