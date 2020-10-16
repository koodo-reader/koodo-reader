//从本地导入书籍
import "./importLocal.css";
import { connect } from "react-redux";
import {
  handleMessageBox,
  handleMessage,
  handleFetchBooks,
} from "../../store/actions/manager";
import { stateType } from "../../store";
import { withNamespaces } from "react-i18next";
import ImportLocal from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
  };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
  handleFetchBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(ImportLocal as any));
