import { connect } from "react-redux";
import {
  handleBookSortCode,
  handleNoteSortCode,
  handleSortDisplay,
  handleFetchBooks,
} from "../../../store/actions";
import { stateType } from "../../../store";
import SortDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    bookSortCode: state.manager.bookSortCode,
    noteSortCode: state.manager.noteSortCode,
    mode: state.sidebar.mode,
    isSortDisplay: state.manager.isSortDisplay,
  };
};
const actionCreator = {
  handleBookSortCode,
  handleSortDisplay,
  handleNoteSortCode,
  handleFetchBooks,
};
export default connect(mapStateToProps, actionCreator)(SortDialog as any);
