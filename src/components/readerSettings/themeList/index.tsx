import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import ThemeList from "./component";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    renderFunc: state.book.renderFunc,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ThemeList as any));
