import { connect } from "react-redux";
import DictSetting from "./component";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
import { handleFetchPlugins } from "../../../store/actions";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    isAuthed: state.manager.isAuthed,
  };
};
const actionCreator = { handleFetchPlugins };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(DictSetting as any) as any) as any);
