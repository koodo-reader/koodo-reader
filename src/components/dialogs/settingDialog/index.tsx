import { connect } from "react-redux";
import SettingDialog from "./component";
import { withTranslation } from "react-i18next";
import {
  handleSetting,
  handleMessageBox,
  handleMessage,
  handleTipDialog,
  handleTip,
} from "../../../store/actions";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    bookmarks: state.reader.bookmarks,
    books: state.manager.books,
    notes: state.reader.notes,
  };
};
const actionCreator = {
  handleSetting,
  handleTipDialog,
  handleTip,
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SettingDialog as any));
