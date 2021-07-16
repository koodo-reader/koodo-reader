//图书导航栏
import { connect } from "react-redux";
import { handleFetchBookmarks, handleSearch } from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import NavigationPanel from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
  };
};
const actionCreator = { handleFetchBookmarks, handleSearch };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(NavigationPanel as any));
