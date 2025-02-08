import {
  handleMode,
  handleSearch,
  handleSortDisplay,
  handleCollapse,
  handleSelectBook,
  handleShelf,
} from "../../store/actions";
import { connect } from "react-redux";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";
import Sidebar from "./component";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state: stateType) => {
  return {
    mode: state.sidebar.mode,
    isCollapsed: state.sidebar.isCollapsed,
    shelfTitle: state.sidebar.shelfTitle,
    isAuthed: state.manager.isAuthed,
  };
};
const actionCreator = {
  handleMode,
  handleSearch,
  handleSortDisplay,
  handleCollapse,
  handleSelectBook,
  handleShelf,
};

export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(Sidebar as any) as any) as any);
