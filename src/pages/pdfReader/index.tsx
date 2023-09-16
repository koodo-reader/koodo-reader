import { connect } from "react-redux";
import {
  handleActionDialog,
  handleReadingState,
  handleReadingBook,
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchBooks,
  handleMenuMode,
  handleNoteKey,
  handleOpenMenu,
} from "../../store/actions";
import Viewer from "./component";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    isOpenActionDialog: state.book.isOpenActionDialog,
    currentBook: state.book.currentBook,
    isReading: state.book.isReading,
    isOpenMenu: state.viewArea.isOpenMenu,
    menuMode: state.viewArea.menuMode,
    notes: state.reader.notes,
  };
};
const actionCreator = {
  handleReadingState,
  handleReadingBook,
  handleActionDialog,
  handleFetchNotes,
  handleFetchBookmarks,
  handleFetchBooks,
  handleMenuMode,
  handleNoteKey,
  handleOpenMenu,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(Viewer as any) as any);
