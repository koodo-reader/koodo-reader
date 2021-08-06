import { connect } from "react-redux";
import { stateType } from "../../store";
import EmptyPage from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    mode: state.sidebar.mode,
    isCollapsed: state.sidebar.isCollapsed,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(EmptyPage as any));
