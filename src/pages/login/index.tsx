import { connect } from "react-redux";
import "./login.css";
import { stateType } from "../../store";
import { handleLoadingDialog, handleFetchAuthed } from "../../store/actions";
import Login from "./component";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = { handleLoadingDialog, handleFetchAuthed };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(Login as any) as any) as any);
