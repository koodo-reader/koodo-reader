//左下角的图标外链
import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../store/actions/manager";
import UpdateInfo from "./component";
import { withNamespaces } from "react-i18next";
import { stateType } from "../../store";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    books: state.manager.books,
  };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(UpdateInfo as any));
