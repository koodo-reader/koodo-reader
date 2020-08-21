import { connect } from "react-redux";
import { handlePercentage } from "../../redux/actions/progressPanel";
import {
  handleOpenMenu,
  handleShowBookmark,
} from "../../redux/actions/viewArea";
import { stateType } from "../../redux/store";

import ViewPage from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    currentEpub: state.book.currentEpub,
    locations: state.progressPanel.locations,
    bookmarks: state.reader.bookmarks,
    isShowBookmark: state.viewArea.isShowBookmark,
  };
};
const actionCreator = {
  handlePercentage,
  handleOpenMenu,
  handleShowBookmark,
};
export default connect(mapStateToProps, actionCreator)(ViewPage);
