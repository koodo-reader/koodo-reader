import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import ThemeList from "./component";
import { stateType } from "../../../store";
const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ThemeList as any));
