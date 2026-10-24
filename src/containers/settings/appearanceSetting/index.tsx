import { connect } from "../../../store/legacyConnect";
import AppearanceSetting from "./component";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";

const mapStateToProps = () => {
  return {};
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(AppearanceSetting as any) as any) as any);
