import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import SettingPanel from "./component";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    locations: state.progressPanel.locations,
    isReading: state.book.isReading,
    readerMode: state.reader.readerMode,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SettingPanel as any) as any);
