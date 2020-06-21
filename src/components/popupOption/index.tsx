import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import { handleOpenMenu, handleMenuMode } from "../../redux/actions/viewArea";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import PopupOption from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    currentEpub: state.book.currentEpub,
    selection: state.viewArea.selection,
    digests: state.reader.digests,
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
)(withNamespaces()(PopupOption as any));
