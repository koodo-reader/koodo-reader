import { connect } from "../../../store/legacyConnect";
import {
  handleFetchBooks,
  handleDeleteDialog,
} from "../../../store/actions";
import { stateType } from "../../../store";
import BookList from "./component";

const mappropsToProps = (state: stateType) => {
  return {
    deletedBooks: state.manager.deletedBooks,

    isCollapsed: state.sidebar.isCollapsed,
    viewMode: state.manager.viewMode,

    selectedBooks: state.manager.selectedBooks,
  };
};
const actionCreator = {
  handleDeleteDialog,
  handleFetchBooks,
};
export default connect(mappropsToProps, actionCreator)(BookList as any);
