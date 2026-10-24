import { connect } from "../../../store/legacyConnect";
import DataSetting from "./component";
import { withTranslation } from "react-i18next";
import { stateType } from "../../../store";
import { withRouter } from "react-router-dom";
import { handleFetchBooks } from "../../../store/actions";

const mapStateToProps = (_state: stateType) => {
  return {
  };
};
const actionCreator = { handleFetchBooks };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(DataSetting as any) as any) as any);
