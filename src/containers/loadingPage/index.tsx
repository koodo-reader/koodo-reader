//图书加载前的动画
import { connect } from "react-redux";
import { stateType } from "../../store";
import LoadingPage from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
  };
};
const actionCreator = {};
export default connect(mapStateToProps, actionCreator)(LoadingPage);
