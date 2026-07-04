import { connect } from "react-redux";
import {
  handleDetailDialog,
  handleShelf,
  handleMode,
} from "../../../store/actions";
import DetailDialog from "./component";
import { stateType } from "../../../store";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return { currentBook: state.book.currentBook };
};
const actionCreator = {
  handleDetailDialog,
  handleShelf,
  handleMode,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withRouter(DetailDialog as any) as any);
