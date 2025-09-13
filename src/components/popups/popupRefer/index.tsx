import { handleSelection } from "../../../store/actions";
import { connect } from "react-redux";
import { stateType } from "../../../store";
import PopupRefer from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    readerMode: state.reader.readerMode,
    color: state.reader.color,
    isChangeDirection: state.viewArea.isChangeDirection,
  };
};
const actionCreator = {
  handleSelection,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PopupRefer as any) as any);
