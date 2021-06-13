//图书导航栏的目录列表
import { connect } from "react-redux";
import { stateType } from "../../../store";
import ContentList from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    chapters: state.reader.chapters,
    htmlBook: state.reader.htmlBook,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(ContentList);
