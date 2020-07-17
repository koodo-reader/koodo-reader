//我的书摘页面
import { connect } from "react-redux";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import DigestList from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    digests: state.reader.digests,
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    chapters: state.reader.chapters,
    books: state.manager.books,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(DigestList as any));
