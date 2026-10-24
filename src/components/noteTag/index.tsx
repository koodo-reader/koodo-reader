import { connect } from "react-redux";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";
import NoteTag from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    isReading: state.book.isReading,
    isShowPopupNote: state.manager.isShowPopupNote,
  };
};
const actionCreator = {
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(NoteTag as any) as any);
