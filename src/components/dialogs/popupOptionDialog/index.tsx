import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import PopupOptionDialog from "./component";
import {
  handlePopupOptionDialog,
  handlePopupOptionUpdate,
} from "../../../store/actions";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenPopupOptionDialog: state.backupPage.isOpenPopupOptionDialog,
  };
};

const actionCreator = {
  handlePopupOptionDialog,
  handlePopupOptionUpdate,
};

export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupOptionDialog as any) as any);
