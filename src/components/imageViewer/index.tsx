import { connect } from "react-redux";
import { stateType } from "../../store";
import ImageViewer from "./component";
import { withNamespaces } from "react-i18next";
const mapStateToProps = (state: stateType) => {
  return {};
};
const actionCreator = {};

export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(ImageViewer as any));
