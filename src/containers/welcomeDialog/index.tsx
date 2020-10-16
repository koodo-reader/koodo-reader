//欢迎页面
import { withNamespaces } from "react-i18next";
import { handleFirst } from "../../store/actions/manager";
import { connect } from "react-redux";
import WelcomeDialog from "./component";

const mapStateToProps = () => {
  return {};
};
const actionCreator = {
  handleFirst,
};

export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(WelcomeDialog as any));
