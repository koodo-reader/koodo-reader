import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import ThemeList from "./component";
import { stateType } from "../../../store";
import {
  handleMessageBox,
  handleMessage,
} from "../../../store/actions/manager";
const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
  };
};
const actionCreator = { handleMessageBox, handleMessage };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ThemeList as any));
