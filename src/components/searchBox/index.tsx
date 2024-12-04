import { connect } from "react-redux";
import { handleSearchResults, handleSearch } from "../../store/actions";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";
import SearchBox from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books,
    notes: state.reader.notes,
    htmlBook: state.reader.htmlBook,
    digests: state.reader.digests,
    isSearch: state.manager.isSearch,
    isReading: state.book.isReading,
    currentBook: state.book.currentBook,
    tabMode: state.sidebar.mode,
    shelfTitle: state.sidebar.shelfTitle,
  };
};
const actionCreator = {
  handleSearchResults,
  handleSearch,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SearchBox as any) as any);
