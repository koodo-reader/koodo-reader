import { connect } from "react-redux";
import { stateType } from "../../store";
import Background from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    readerMode: state.reader.readerMode,
    isNavLocked: state.reader.isNavLocked,
    isSettingLocked: state.reader.isSettingLocked,
    scale: state.reader.scale,
    margin: state.reader.margin,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(Background as any);
