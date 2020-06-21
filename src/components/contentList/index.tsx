//图书导航栏的目录列表
import { connect } from "react-redux";
import { stateType } from "../../redux/store";
import ContentList from "./component";
const mapStateToProps = (state: stateType) => {
  return { currentEpub: state.book.currentEpub };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(ContentList);
