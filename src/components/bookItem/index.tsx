//控制列表模式下的图书显示
import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
} from "../../redux/actions/book";
import { stateType } from "../../redux/store";
import BookItem from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    isReading: state.book.isReading,
    percentage: state.progressPanel.percentage,
  };
};
const actionCreator = {
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
};
export default connect(mapStateToProps, actionCreator)(BookItem);
