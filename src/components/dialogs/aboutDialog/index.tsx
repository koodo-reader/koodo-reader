import { connect } from "react-redux";
import {
  handleSetting,
  handleAbout,
  handleFeedbackDialog,
} from "../../../store/actions";
import { stateType } from "../../../store";
import AboutDialog from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    isSettingOpen: state.manager.isSettingOpen,
    isAboutOpen: state.manager.isAboutOpen,
    isNewWarning: state.manager.isNewWarning,
    books: state.manager.books,
    notes: state.reader.notes,
    deletedBooks: state.manager.deletedBooks,
  };
};
const actionCreator = {
  handleSetting,
  handleAbout,
  handleFeedbackDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(AboutDialog as any) as any);
