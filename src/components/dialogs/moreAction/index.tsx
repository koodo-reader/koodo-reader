import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleSelectBook,
  handleAddDialog,
  handleSelectedBooks,
  handleActionDialog,
  handleReadingBook,
  handleFetchBooks,
  handleDetailDialog,
} from "../../../store/actions";

import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import ActionDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    isSelectBook: state.manager.isSelectBook,
    deletedBooks: state.manager.deletedBooks,
  };
};
const actionCreator = {
  handleEditDialog,
  handleAddDialog,
  handleDeleteDialog,
  handleReadingBook,
  handleActionDialog,
  handleFetchBooks,
  handleDetailDialog,
  handleSelectBook,
  handleSelectedBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ActionDialog as any) as any);
