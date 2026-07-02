import { connect } from "react-redux";
import {
  handleActionDialog,
  handleFetchBooks,
  handleRefreshBookCover,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import MarkAction from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
  };
};
const actionCreator = {
  handleActionDialog,
  handleFetchBooks,
  handleRefreshBookCover,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(MarkAction as any) as any);
