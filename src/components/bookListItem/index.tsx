import { connect } from "react-redux";
import {
  handleReadingBook,
  handleActionDialog,
} from "../../store/actions";
import { withTranslation } from "react-i18next";

import { stateType } from "../../store";
import BookListItem from "./component";
import { withRouter } from "react-router-dom";
const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
    isSelectBook: state.manager.isSelectBook,
    isOpenActionDialog: state.book.isOpenActionDialog,
  };
};
const actionCreator = {
  handleReadingBook,
  handleActionDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(BookListItem as any) as any) as any);
