import { connect } from "react-redux";
import { withNamespaces } from "react-i18next";
import ThemeList from "./component";
import { stateType } from "../../redux/store";
const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(ThemeList as any));
