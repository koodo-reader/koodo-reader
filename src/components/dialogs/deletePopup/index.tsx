import { connect } from "react-redux";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import DeletePopup from "./component";

const mapStateToProps = (_state: stateType) => {
  return {};
};
const actionCreator = {
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(DeletePopup as any) as any);
