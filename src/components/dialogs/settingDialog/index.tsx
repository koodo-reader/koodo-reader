import { connect } from "react-redux";
import SettingDialog from "./component";
import { withTranslation } from "react-i18next";
import {
  handleSetting,
  handleTipDialog,
  handleTip,
  handleFetchBooks,
  handleFetchPlugins,
  setDataSource,
} from "../../../store/actions";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    bookmarks: state.reader.bookmarks,
    books: state.manager.books,
    plugins: state.manager.plugins,
    notes: state.reader.notes,
    dataSourceList: state.backupPage.dataSourceList,
  };
};
const actionCreator = {
  handleSetting,
  handleTipDialog,
  handleTip,
  handleFetchBooks,
  handleFetchPlugins,
  setDataSource,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SettingDialog as any) as any);
