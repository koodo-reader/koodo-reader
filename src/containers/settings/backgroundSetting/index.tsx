import { connect } from "react-redux";
import BackgroundSetting from "./component";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";

const mapStateToProps = () => {
  return {};
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(BackgroundSetting as any) as any) as any);
