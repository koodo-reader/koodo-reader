import { connect } from "react-redux";
import {
  handleNewDialog,
  handleNewWarning,
  handleFetchAuthed,
  handleLoginOptionList,
  handleFetchDataSourceList,
  handleFetchDefaultSyncOption,
} from "../../../store/actions";
import UpdateInfo from "./component";
import { withTranslation } from "react-i18next";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    books: state.manager.books,
    isAuthed: state.manager.isAuthed,
    isShowNew: state.manager.isShowNew,
  };
};
const actionCreator = {
  handleNewDialog,
  handleNewWarning,
  handleFetchAuthed,
  handleLoginOptionList,
  handleFetchDataSourceList,
  handleFetchDefaultSyncOption,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(UpdateInfo as any) as any);
