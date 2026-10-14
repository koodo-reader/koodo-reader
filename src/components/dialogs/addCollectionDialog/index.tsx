import { connect } from "react-redux";
import {
  handleAddCollectionDialog,
  handleActionDialog,
  handleSelectBook,
  handleSelectedBooks,
  handleFetchBooks,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import AddCollectionDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    isSelectBook: state.manager.isSelectBook,
    selectedBooks: state.manager.selectedBooks,
  };
};
const actionCreator = {
  handleAddCollectionDialog,
  handleActionDialog,
  handleSelectBook,
  handleSelectedBooks,
  handleFetchBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(AddCollectionDialog as any) as any);
