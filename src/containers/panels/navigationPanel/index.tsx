import { connect } from "react-redux";
import {
  handleFetchBookmarks,
  handleSearch,
  handleNavLock,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import NavigationPanel from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    bookmarks: state.reader.bookmarks,
    htmlBook: state.reader.htmlBook,
    isNavLocked: state.reader.isNavLocked,
  };
};
const actionCreator = { handleFetchBookmarks, handleSearch, handleNavLock };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(NavigationPanel as any) as any);
