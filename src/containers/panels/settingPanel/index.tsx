import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import SettingPanel from "./component";
import { stateType } from "../../../store";
import { handleSettingLock } from "../../../store/actions";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    locations: state.progressPanel.locations,
    isReading: state.book.isReading,
    readerMode: state.reader.readerMode,
    backgroundColor: state.reader.backgroundColor,
    isSettingLocked: state.reader.isSettingLocked,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = { handleSettingLock };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SettingPanel as any) as any);
