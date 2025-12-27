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

    htmlBook: state.reader.htmlBook,
    backgroundColor: state.reader.backgroundColor,
    isNavLocked: state.reader.isNavLocked,
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = { handleFetchBookmarks, handleSearch, handleNavLock };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(NavigationPanel as any) as any);
