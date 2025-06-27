import { connect } from "react-redux";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import { handleShowBookmark } from "../../../store/actions";
import NavList from "./component";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    htmlBook: state.reader.htmlBook,

    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
  };
};
const actionCreator = { handleShowBookmark };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(NavList as any) as any);
