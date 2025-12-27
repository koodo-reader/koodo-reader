import { connect } from "react-redux";
import {
  handleOpenMenu,
  handleMenuMode,
  handleFetchPlugins,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import PopupTrans from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    originalText: state.reader.originalText,
    plugins: state.manager.plugins,
    isAuthed: state.manager.isAuthed,
  };
};
const actionCreator = {
  handleOpenMenu,
  handleMenuMode,
  handleFetchPlugins,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupTrans as any) as any);
