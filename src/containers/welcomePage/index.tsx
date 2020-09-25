//欢迎页面
import { withNamespaces } from "react-i18next";
import { handleFirst } from "../../redux/actions/manager";
import { connect } from "react-redux";
import WelcomePage from "./component";

const mapStateToProps = () => {
  return {};
};
const actionCreator = {
  handleFirst,
};

export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(WelcomePage as any));
