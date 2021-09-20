import { connect } from "react-redux";
import "./manager.css";
import { stateType } from "../../store";
import { handleLoadingDialog } from "../../store/actions";
import Redirect from "./component";
import { withTranslation } from "react-i18next";
const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = { handleLoadingDialog };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(Redirect));
