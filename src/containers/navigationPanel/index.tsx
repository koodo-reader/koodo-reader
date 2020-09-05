//图书导航栏
import { connect } from "react-redux";
import { handleFetchBookmarks } from "../../redux/actions/reader";
import { handleSearch } from "../../redux/actions/manager";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
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
)(withNamespaces()(NavigationPanel as any));
