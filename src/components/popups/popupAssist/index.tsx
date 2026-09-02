import { connect } from "react-redux";
import {
  handleOpenMenu,
  handleMenuMode,
  handleFetchPlugins,
  handleSetting,
  handleSettingMode,
  handleQuoteText,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import PopupAssist from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    originalText: state.reader.originalText,
    quoteText: state.reader.quoteText,
    htmlBook: state.reader.htmlBook,
    plugins: state.manager.plugins,
    isAuthed: state.manager.isAuthed,
  };
};
const actionCreator = {
  handleOpenMenu,
  handleMenuMode,
  handleFetchPlugins,
  handleSetting,
  handleSettingMode,
  handleQuoteText,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupAssist as any) as any);
