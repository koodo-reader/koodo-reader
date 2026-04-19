import { connect } from "react-redux";
import { stateType } from "../../store";
import Background from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    readerMode: state.reader.readerMode,
    isNavLocked: state.reader.isNavLocked,
    isSettingLocked: state.reader.isSettingLocked,
    backgroundColor: state.reader.backgroundColor,
    scale: state.reader.scale,
    margin: state.reader.margin,
    readerBackgroundImage: state.reader.readerBackgroundImage,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(Background as any);
