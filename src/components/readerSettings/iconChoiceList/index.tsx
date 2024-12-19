import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import IconChoiceList from "./component";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(IconChoiceList as any) as any);
