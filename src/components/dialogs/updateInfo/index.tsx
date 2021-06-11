//左下角的图标外链
import { connect } from "react-redux";
import {
  handleMessageBox,
  handleMessage,
  handleNewDialog,
} from "../../../store/actions/manager";
import UpdateInfo from "./component";
import { withTranslation } from "react-i18next";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    books: state.manager.books,
    isShowNew: state.manager.isShowNew,
  };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
  handleNewDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(UpdateInfo as any));
