import { connect } from "react-redux";
import { stateType } from "../../store";
import ImageViewer from "./component";
import { withTranslation } from "react-i18next";
const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = {};

export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ImageViewer as any));
