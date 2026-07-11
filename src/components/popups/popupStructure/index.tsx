import { connect } from "react-redux";
import { stateType } from "../../../store";
import {
  handleMenuMode,
  handleOriginalText,
  handleOpenMenu,
  handleSetting,
  handleSettingMode,
} from "../../../store/actions";
import { withTranslation } from "react-i18next";
import PopupStructure from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    originalText: state.reader.originalText,
    currentBook: state.book.currentBook,
    plugins: state.manager.plugins,
  };
};
const actionCreator = {
  handleMenuMode,
  handleOriginalText,
  handleOpenMenu,
  handleSetting,
  handleSettingMode,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupStructure as any) as any);
