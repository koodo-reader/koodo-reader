//我的书摘页面
import { connect } from "react-redux";
import { stateType } from "../../../store";
import { withNamespaces } from "react-i18next";
import CardList from "./component";
import { handleReadingBook } from "../../../store/actions/book";
import {
  handleMessageBox,
  handleMessage,
} from "../../../store/actions/manager";

const mapStateToProps = (state: stateType) => {
  return {
    digests: state.reader.digests,
    isCollapsed: state.sidebar.isCollapsed,
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    chapters: state.reader.chapters,
    books: state.manager.books,
    noteSortCode: state.manager.noteSortCode,
  };
};
const actionCreator = {
  handleReadingBook,
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(CardList as any));
