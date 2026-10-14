import { connect } from "react-redux";
import {
  handleCollectionDetailDialog,
  handleFetchBooks,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import CollectionDetailDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentCollectionKey: state.collection.currentCollectionKey,
    refreshBookKey: state.manager.refreshBookKey,
  };
};
const actionCreator = {
  handleCollectionDetailDialog,
  handleFetchBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(CollectionDetailDialog as any) as any);
