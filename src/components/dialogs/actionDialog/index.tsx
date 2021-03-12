import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleActionDialog,
  handleReadingBook,
} from "../../../store/actions/book";
import {
  handleMessageBox,
  handleMessage,
  handleFetchBooks,
} from "../../../store/actions/manager";
import { stateType } from "../../../store";
import { withNamespaces } from "react-i18next";
import ActionDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    mode: state.sidebar.mode,
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
  };
};
const actionCreator = {
  handleEditDialog,
  handleAddDialog,
  handleDeleteDialog,
  handleReadingBook,
  handleActionDialog,
  handleMessageBox,
  handleMessage,
  handleFetchBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(ActionDialog as any));
