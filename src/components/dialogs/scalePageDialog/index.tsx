import { connect } from "react-redux";
import { stateType } from "../../../store";
import { handleFitPage, handleScale, handleScalePageDialog } from "../../../store/actions";
import ScalePageDialog from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    scale: state.reader.scale,
    isFitPage: state.reader.isFitPage,
    isSettingLocked: state.reader.isSettingLocked,
    isDockedRight: state.reader.isDockedRight,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = {
  handleScale,
  handleFitPage,
  handleScalePageDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ScalePageDialog as any) as any);
