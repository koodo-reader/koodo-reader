import { connect } from "react-redux";
import "./manager.css";
import { stateType } from "../../store";
import { handleLoadingDialog } from "../../store/actions";
import Redirect from "./component";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
const mapStateToProps = (_state: stateType) => {
  return {};
};
const actionCreator = { handleLoadingDialog };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(Redirect as any) as any) as any);
