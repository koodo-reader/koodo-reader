import { connect } from "react-redux";
import {
  handleNewWarning,
  handleFetchAuthed,
  handleFetchUserInfo,
  handleLoginOptionList,
  handleShowSupport,
} from "../../../store/actions";
import SupporDialog from "./component";
import { withTranslation } from "react-i18next";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    books: state.manager.books,
    isAuthed: state.manager.isAuthed,
    isShowSupport: state.manager.isShowSupport,
    userInfo: state.manager.userInfo,
  };
};
const actionCreator = {
  handleNewWarning,
  handleFetchAuthed,
  handleLoginOptionList,
  handleFetchUserInfo,
  handleShowSupport,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SupporDialog as any) as any);
