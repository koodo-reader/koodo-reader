import { connect } from "react-redux";
import { handleAnnotationDialog } from "../../../store/actions";
import { stateType } from "../../../store";
import AnnotationDialog from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    isAnnotationOpen: state.reader.isAnnotationOpen,
    isSettingLocked: state.reader.isSettingLocked,
  };
};
const actionCreator = {
  handleAnnotationDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(AnnotationDialog as any) as any);
