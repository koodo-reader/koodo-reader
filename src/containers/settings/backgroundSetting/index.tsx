import { connect } from "../../../store/legacyConnect";
import BackgroundSetting from "./component";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
import { handleReaderBackgroundImage } from "../../../store/actions";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return { isAuthed: state.manager.isAuthed };
};
const actionCreator = { handleReaderBackgroundImage };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(BackgroundSetting as any) as any) as any);
