import { handleJumpPosition } from "../../../store/actions";
import { connect } from "../../../store/legacyConnect";
import { stateType } from "../../../store";
import PopupRefer from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    readerMode: state.reader.readerMode,
  };
};
const actionCreator = {
  handleJumpPosition,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupRefer as any) as any);
