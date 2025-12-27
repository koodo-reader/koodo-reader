import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingBook,
  handleDragItem,
  handleDeleteDialog,
  handleSelectBook,
  handleSelectedBooks,
} from "../../store/actions";
import { withTranslation } from "react-i18next";
import BookCardItem from "./component";
import { stateType } from "../../store";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
    dragItem: state.book.dragItem,
    currentBook: state.book.currentBook,
    isSelectBook: state.manager.isSelectBook,
    selectedBooks: state.manager.selectedBooks,
  };
};
const actionCreator = {
  handleReadingBook,
  handleActionDialog,
  handleDragItem,
  handleSelectBook,
  handleDeleteDialog,
  handleSelectedBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(BookCardItem as any) as any) as any);
