//卡片模式下的图书显示
import { connect } from "react-redux";
import {
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
} from "../../redux/actions/book";
import Book from "./component";
const mapStateToProps = () => {
  return {};
};
const actionCreator = {
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
  handleEditDialog,
  handleDeleteDialog,
  handleAddDialog,
};
export default connect(mapStateToProps, actionCreator)(Book);
