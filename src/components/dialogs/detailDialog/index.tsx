import { connect } from "react-redux";
import { handleDetailDialog } from "../../../store/actions";
import DetailDialog from "./component";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return { currentBook: state.book.currentBook };
};
const actionCreator = {
  handleDetailDialog,
};
export default connect(mapStateToProps, actionCreator)(DetailDialog as any);
