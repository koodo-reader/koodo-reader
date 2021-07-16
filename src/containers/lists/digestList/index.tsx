//我的高亮页面
import { connect } from "react-redux";
import { stateType } from "../../../store";
import DigestList from "./component";
import { handleFetchNotes } from "../../../store/actions";

const mapStateToProps = (state: stateType) => {
  return {
    digests: state.reader.digests,
    isSearch: state.manager.isSearch,
    isCollapsed: state.sidebar.isCollapsed,
    searchResults: state.manager.searchResults,
  };
};
const actionCreator = { handleFetchNotes };
export default connect(mapStateToProps, actionCreator)(DigestList);
