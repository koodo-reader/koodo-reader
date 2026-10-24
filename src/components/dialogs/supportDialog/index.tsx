import { connect } from "../../../store/legacyConnect";
import {
  handleFetchAuthed,
  handleFetchUserInfo,
  handleLoginOptionList,
  handleShowSupport,
  handleFetchDataSourceList,
  handleFetchDefaultSyncOption,
} from "../../../store/actions";
import SupportDialog from "./component";
import { withTranslation } from "react-i18next";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    isAuthed: state.manager.isAuthed,
    isShowSupport: state.manager.isShowSupport,
  };
};
const actionCreator = {
  handleFetchAuthed,
  handleLoginOptionList,
  handleFetchUserInfo,
  handleShowSupport,
  handleFetchDataSourceList,
  handleFetchDefaultSyncOption,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SupportDialog as any) as any);
