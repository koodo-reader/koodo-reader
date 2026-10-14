import { connect } from "react-redux";
import {
  handleCollectionDialog,
  handleCollectionDialogMode,
  handleCollectionDialogBooks,
  handleCollectionDialogKey,
  handleSelectBook,
  handleSelectedBooks,
  handleFetchBooks,
  handleActionDialog,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import CollectionDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    collectionDialogMode: state.collection.collectionDialogMode,
    collectionDialogBooks: state.collection.collectionDialogBooks,
    collectionDialogKey: state.collection.collectionDialogKey,
  };
};
const actionCreator = {
  handleCollectionDialog,
  handleCollectionDialogMode,
  handleCollectionDialogBooks,
  handleCollectionDialogKey,
  handleSelectBook,
  handleSelectedBooks,
  handleFetchBooks,
  handleActionDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(CollectionDialog as any) as any);
