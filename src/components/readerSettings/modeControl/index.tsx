import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import ModeControl from "./component";
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
)(withTranslation()(ModeControl as any));
