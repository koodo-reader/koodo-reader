import { connect } from "../../../store/legacyConnect";
import { stateType } from "../../../store";
import { handleFitPage, handleScale, handleScalePageDialog } from "../../../store/actions";
import ScalePageDialog from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    scale: state.reader.scale,
    isFitPage: state.reader.isFitPage,
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
