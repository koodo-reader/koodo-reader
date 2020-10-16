//为空页面
import { connect } from "react-redux";
import { stateType } from "../../store";
import { withNamespaces } from "react-i18next";
import EmptyPage from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    mode: state.sidebar.mode,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(EmptyPage as any));
