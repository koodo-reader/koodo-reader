//为空页面
import { connect } from "react-redux";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";
import ViewMode from "./component";
import { handleFetchList } from "../../store/actions";
const mapStateToProps = (state: stateType) => {
  return {
    viewMode: state.manager.viewMode,
  };
};
const actionCreator = { handleFetchList };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ViewMode as any));
