import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import { handleOpenMenu, handleMenuMode } from "../../redux/actions/viewArea";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import PopupNote from './component'
const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    notes: state.reader.notes,
    chapters: state.reader.chapters,
  };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
  handleOpenMenu,
  handleMenuMode,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(PopupNote as any));
