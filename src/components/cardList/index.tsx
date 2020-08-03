//我的书摘页面
import { connect } from "react-redux";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import CardList from "./component";
import {
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
} from "../../redux/actions/book";

const mapStateToProps = (state: stateType) => {
  return {
    digests: state.reader.digests,
    currentEpub: state.book.currentEpub,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    chapters: state.reader.chapters,
    books: state.manager.books,
    epubs: state.manager.epubs,
  };
};
const actionCreator = {
  handleReadingState,
  handleReadingBook,
  handleReadingEpub,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(CardList as any));
