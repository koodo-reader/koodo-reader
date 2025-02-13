import { connect } from "react-redux";
import { stateType } from "../../store";
import Background from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    readerMode: state.reader.readerMode,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(Background as any);
