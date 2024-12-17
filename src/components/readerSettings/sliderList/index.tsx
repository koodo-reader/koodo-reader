import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import SliderList from "./component";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    renderBookFunc: state.book.renderBookFunc,
    renderBookWithLineColorsFunc: state.book.renderBookWithLineColorsFunc
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SliderList as any) as any);
