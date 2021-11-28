import { connect } from "react-redux";
import { stateType } from "../../store";
import ViewArea from "./component";
import {
  handlePercentage,
  handleOpenMenu,
  handleShowBookmark,
  handleReadingEpub,
} from "../../store/actions";
import "./index.css";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    chapters: state.reader.chapters,
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    locations: state.progressPanel.locations,
    flattenChapters: state.reader.flattenChapters,
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

export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ViewArea));
