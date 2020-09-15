import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleActionDialog,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
} from "../../redux/actions/book";

import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import ActionDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
  };
};
const actionCreator = {
  handleEditDialog,
  handleAddDialog,
  handleDeleteDialog,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
  handleActionDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(ActionDialog as any));
