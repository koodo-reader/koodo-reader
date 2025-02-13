import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import ModeControl from "./component";
import { stateType } from "../../../store";
import { handleReaderMode } from "../../../store/actions";
const mapStateToProps = (state: stateType) => {
  return {
    renderBookFunc: state.book.renderBookFunc,
    readerMode: state.reader.readerMode,
    currentBook: state.book.currentBook,
  };
};
const actionCreator = { handleReaderMode };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ModeControl as any) as any);
