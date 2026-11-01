import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import StudyLangDialog from "./component";
import { stateType } from "../../../store";
import {
  handleStudyLangDialog,
  handleSetting,
  handleSettingMode,
} from "../../../store/actions";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    htmlBook: state.reader.htmlBook,
    isAuthed: state.manager.isAuthed,
    isSettingLocked: state.reader.isSettingLocked,
    isDockedRight: state.reader.isDockedRight,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = {
  handleStudyLangDialog,
  handleSetting,
  handleSettingMode,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(StudyLangDialog as any) as any);
