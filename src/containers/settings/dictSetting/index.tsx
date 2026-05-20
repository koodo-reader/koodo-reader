import { connect } from "react-redux";
import DictSetting from "./component";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
import { handleFetchPlugins } from "../../../store/actions";

const mapStateToProps = () => {
  return {};
};
const actionCreator = { handleFetchPlugins };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(DictSetting as any) as any) as any);
