import { connect } from "react-redux";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import CardList from "./component";
import { handleReadingBook } from "../../../store/actions";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    digests: state.reader.digests,
    isCollapsed: state.sidebar.isCollapsed,
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    chapters: state.reader.chapters,
    books: state.manager.books,
    noteSortCode: state.manager.noteSortCode,
  };
};
const actionCreator = {
  handleReadingBook,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(CardList as any) as any) as any);
