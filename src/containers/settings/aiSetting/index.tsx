import { connect } from "react-redux";
import AISetting from "./component";
import { withTranslation } from "react-i18next";
import {
  handleFetchPlugins,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withRouter } from "react-router-dom";

const mapStateToProps = (_state: stateType) => {
  return {
  };
};
const actionCreator = {
  handleFetchPlugins,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(AISetting as any) as any) as any);
