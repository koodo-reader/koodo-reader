import { connect } from "react-redux";
import {
  handleDeleteDialog,
  handleSelectBook,
  handleAddDialog,
  handleSelectedBooks,
} from "../../store/actions";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";
import SelectBook from "./component";

const mappropsToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    selectedBooks: state.manager.selectedBooks,
    isCollapsed: state.sidebar.isCollapsed,
    isSelectBook: state.manager.isSelectBook,
  };
};
const actionCreator = {
  handleDeleteDialog,
  handleSelectBook,
  handleAddDialog,
  handleSelectedBooks,
};
export default connect(
  mappropsToProps,
  actionCreator
)(withTranslation()(SelectBook as any));
