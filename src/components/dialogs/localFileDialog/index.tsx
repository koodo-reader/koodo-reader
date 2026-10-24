import {
  handleLocalFileDialog,
  handleFetchBooks,
} from "../../../store/actions";
import { connect } from "../../../store/legacyConnect";
import { withTranslation } from "react-i18next";
import { stateType } from "../../../store";
import LocalFileDialog from "./component";
import { withRouter } from "react-router-dom";
const mapStateToProps = (_state: stateType) => {
  return {
  };
};
const actionCreator = {
  handleLocalFileDialog,
  handleFetchBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(LocalFileDialog as any) as any) as any);
