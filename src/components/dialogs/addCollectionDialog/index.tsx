import { connect } from "../../../store/legacyConnect";
import {
  handleAddCollectionDialog,
  handleActionDialog,
  handleSelectBook,
  handleSelectedBooks,
  handleCollectionDialogBooks,
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
    dialogBooks: state.collection.collectionDialogBooks,
  };
};
const actionCreator = {
  handleAddCollectionDialog,
  handleActionDialog,
  handleSelectBook,
  handleSelectedBooks,
  handleCollectionDialogBooks,
  handleFetchBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(AddCollectionDialog as any) as any);
