import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import PopupOptionDialog from "./component";
import {
  handlePopupOptionDialog,
  handlePopupOptionUpdate,
} from "../../../store/actions";
import { stateType } from "../../../store";

const mapStateToProps = (_state: stateType) => {
  return {
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
