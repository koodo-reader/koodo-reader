import { connect } from "react-redux";
import AboutSetting from "./component";
import { withTranslation } from "react-i18next";
import { stateType } from "../../../store";
import { withRouter } from "react-router-dom";

const mapStateToProps = (_state: stateType) => {
  return {
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(AboutSetting as any) as any) as any);
