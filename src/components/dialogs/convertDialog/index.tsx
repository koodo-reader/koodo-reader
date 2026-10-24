import { connect } from "../../../store/legacyConnect";
import {
  handleSetting,
  handleConvertDialog,
  handleSettingMode,
} from "../../../store/actions";
import { stateType } from "../../../store";
import ConvertDialog from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    isAuthed: state.manager.isAuthed,
    currentBook: state.book.currentBook,
    plugins: state.manager.plugins || [],
  };
};
const actionCreator = {
  handleSetting,
  handleConvertDialog,
  handleSettingMode,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ConvertDialog as any) as any);
