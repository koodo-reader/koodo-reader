import { connect } from "react-redux";
import { handleFetchBooks } from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import DeletePopup from "./component";

const mapStateToProps = (_state: stateType) => {
  return {};
};
const actionCreator = {
  handleFetchBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(DeletePopup as any) as any);
