import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import ThemeList from "./component";
import { stateType } from "../../../store";
import { handleBackgroundColor } from "../../../store/actions";

const mapStateToProps = (state: stateType) => {
  return {
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = { handleBackgroundColor };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ThemeList as any) as any);
