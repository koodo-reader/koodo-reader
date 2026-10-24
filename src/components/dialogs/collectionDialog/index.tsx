import { connect } from "../../../store/legacyConnect";
import {
  handleCollectionDialog,
  handleCollectionDialogKey,
  handleFetchBooks,
  handleActionDialog,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import CollectionDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    collectionDialogKey: state.collection.collectionDialogKey,
  };
};
const actionCreator = {
  handleCollectionDialog,
  handleCollectionDialogKey,
  handleFetchBooks,
  handleActionDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(CollectionDialog as any) as any);
