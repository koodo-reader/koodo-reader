//我的书签页面
import { connect } from "react-redux";
import { handleFetchBookmarks } from "../../store/actions/reader";
import { handleMessageBox, handleMessage } from "../../store/actions/manager";
import { stateType } from "../../store";
import { withNamespaces } from "react-i18next";
import BookmarkPage from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    bookmarks: state.reader.bookmarks,
    books: state.manager.books,
  };
};
const actionCreator = {
  handleFetchBookmarks,
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(BookmarkPage as any));
