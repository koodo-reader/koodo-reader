import { connect } from "react-redux";
import { stateType } from "../../store";
import {
  handleFetchBookmarks,
  handleFetchNotes,
  handleShowBookmark,
} from "../../store/actions";
import DeleteIcon from "./component";
import { withTranslation } from "react-i18next";
const mapStateToProps = (state: stateType) => {
  return {
    htmlBook: state.reader.htmlBook,
  };
};
const actionCreator = {
  handleFetchBookmarks,
  handleFetchNotes,
  handleShowBookmark,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(DeleteIcon as any) as any);
