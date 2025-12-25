import { connect } from "react-redux";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";
import ViewMode from "./component";
import { handleFetchViewMode } from "../../store/actions";
const mapStateToProps = (state: stateType) => {
  return {
    viewMode: state.manager.viewMode,
  };
};
const actionCreator = { handleFetchViewMode };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ViewMode as any) as any);
