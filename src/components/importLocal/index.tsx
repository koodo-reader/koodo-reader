//从本地导入书籍
import "./importLocal.css";
import { connect } from "react-redux";
import {
  handleMessageBox,
  handleMessage,
  handleFetchBooks,
  handleLoadingDialog,
} from "../../store/actions/manager";
import { handleReadingBook } from "../../store/actions/book";
import { stateType } from "../../store";
import { withNamespaces } from "react-i18next";
import ImportLocal from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    deletedBooks: state.manager.deletedBooks,
  };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
  handleFetchBooks,
  handleReadingBook,
  handleLoadingDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(ImportLocal as any));
