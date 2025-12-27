import { connect } from "react-redux";
import { handleSetting, handleAbout } from "../../../store/actions";
import { stateType } from "../../../store";
import AboutDialog from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    isSettingOpen: state.manager.isSettingOpen,
    isAboutOpen: state.manager.isAboutOpen,
    isNewWarning: state.manager.isNewWarning,

    deletedBooks: state.manager.deletedBooks,
  };
};
const actionCreator = {
  handleSetting,
  handleAbout,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(AboutDialog as any) as any);
