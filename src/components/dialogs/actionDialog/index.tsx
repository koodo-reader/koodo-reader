import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleActionDialog,
  handleReadingBook,
  handleFetchBooks,
} from "../../../store/actions";

import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
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
  handleFetchBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ActionDialog as any));
