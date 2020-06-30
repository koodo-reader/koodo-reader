//我的书摘页面
import { connect } from "react-redux";
import { stateType } from "../../redux/store";
import {
  handleFetchDigests,
  handleFetchBookmarks,
  handleFetchNotes,
  handleFetchHighlighters,
} from "../../redux/actions/reader";
import DeleteIcon from "./component";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
const mapStateToProps = (state: stateType) => {
  return {
    digests: state.reader.digests,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    highlighters: state.reader.highlighters,
  };
};
const actionCreator = {
  handleFetchDigests,
  handleFetchBookmarks,
  handleFetchNotes,
  handleMessageBox,
  handleMessage,
  handleFetchHighlighters,
};
export default connect(mapStateToProps, actionCreator)(DeleteIcon as any);
