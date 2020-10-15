import { connect } from "react-redux";
import { stateType } from "../../redux/store";
import ViewArea from "./component";
import { handlePercentage } from "../../redux/actions/progressPanel";
import {
  handleOpenMenu,
  handleShowBookmark,
} from "../../redux/actions/viewArea";
import { handleReadingEpub } from "../../redux/actions/book";

const mapStateToProps = (state: stateType) => {
  return {
    chapters: state.reader.chapters,
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    locations: state.progressPanel.locations,
    bookmarks: state.reader.bookmarks,
    isShowBookmark: state.viewArea.isShowBookmark,
  };
};
const actionCreator = {
  handlePercentage,
  handleOpenMenu,
  handleShowBookmark,
  handleReadingEpub,
};

export default connect(mapStateToProps, actionCreator)(ViewArea);
