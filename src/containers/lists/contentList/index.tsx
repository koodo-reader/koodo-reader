import { connect } from "react-redux";
import { stateType } from "../../../store";
import ContentList from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    chapters: state.reader.chapters,
    htmlBook: state.reader.htmlBook,
    renderFunc: state.book.renderFunc,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(ContentList);
