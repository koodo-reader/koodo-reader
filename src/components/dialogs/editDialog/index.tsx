import { connect } from "react-redux";
import "./editDialog.css";
import { handleFetchBooks } from "../../../store/actions";
import { handleEditDialog, handleActionDialog } from "../../../store/actions";
import { stateType } from "../../../store";
import EditDialog from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenDeleteDialog: state.book.isOpenDeleteDialog,
    currentBook: state.book.currentBook,
  };
};
const actionCreator = {
  handleFetchBooks,
  handleEditDialog,
  handleActionDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(EditDialog as any) as any);
