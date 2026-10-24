import { connect } from "react-redux";
import {
  handleBookSortCode,
  handleNoteSortCode,
  handleSortDisplay,
  handleFetchBooks,
  handleFetchNotes,
} from "../../../store/actions";
import { stateType } from "../../../store";
import SortDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    bookSortCode: state.manager.bookSortCode,
    noteSortCode: state.manager.noteSortCode,
    mode: state.sidebar.mode,
  };
};
const actionCreator = {
  handleBookSortCode,
  handleSortDisplay,
  handleNoteSortCode,
  handleFetchBooks,
  handleFetchNotes,
};
export default connect(mapStateToProps, actionCreator)(SortDialog as any);
