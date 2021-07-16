//我的高亮页面
import { connect } from "react-redux";
import { stateType } from "../../store";
import {
  handleFetchBookmarks,
  handleFetchNotes,
  handleShowBookmark,
  handleMessageBox,
  handleMessage,
} from "../../store/actions";
import DeleteIcon from "./component";
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
