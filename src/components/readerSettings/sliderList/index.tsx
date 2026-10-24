import { connect } from "../../../store/legacyConnect";
import { withTranslation } from "react-i18next";
import SliderList from "./component";
import { stateType } from "../../../store";
import { handleMargin, handleScale } from "../../../store/actions";

const mapStateToProps = (state: stateType) => {
  return {
    renderBookFunc: state.book.renderBookFunc,
    scale: state.reader.scale,
    htmlBook: state.reader.htmlBook,
  };
};
const actionCreator = {
  handleMargin,
  handleScale,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SliderList as any) as any);
