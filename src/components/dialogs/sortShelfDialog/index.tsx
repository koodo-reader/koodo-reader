import {
  handleSortShelfDialog,
  handleMode,
  handleShelf,
} from "../../../store/actions";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { stateType } from "../../../store";
import SortShelfDialog from "./component";
import { withRouter } from "react-router-dom";
const mapStateToProps = (state: stateType) => {
  return {
    isOpenSortShelfDialog: state.backupPage.isOpenSortShelfDialog,
  };
};
const actionCreator = {
  handleSortShelfDialog,
  handleMode,
  handleShelf,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(SortShelfDialog as any) as any) as any);
