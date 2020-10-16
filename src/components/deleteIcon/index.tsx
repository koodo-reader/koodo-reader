//我的书摘页面
import { connect } from "react-redux";
import { stateType } from "../../store";
import {
  handleFetchBookmarks,
  handleFetchNotes,
} from "../../store/actions/reader";
import { handleShowBookmark } from "../../store/actions/viewArea";
import DeleteIcon from "./component";
import { handleMessageBox, handleMessage } from "../../store/actions/manager";
const mapStateToProps = (state: stateType) => {
  return {
    digests: state.reader.digests,
    bookmarks: state.reader.bookmarks,
    notes: state.reader.notes,
    isReading: state.book.isReading,
  };
};
const actionCreator = {
  handleFetchBookmarks,
  handleFetchNotes,
  handleMessageBox,
  handleMessage,
  handleShowBookmark,
};
export default connect(mapStateToProps, actionCreator)(DeleteIcon as any);
