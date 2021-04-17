import { handleMode } from "../../store/actions/sidebar";
import { connect } from "react-redux";
import { stateType } from "../../store";
import { withNamespaces } from "react-i18next";
import Sidebar from "./component";
import { handleSearch, handleSortDisplay } from "../../store/actions/manager";
import {
  handleDragToLove,
  handleDragToDelete,
  handleCollapse,
} from "../../store/actions/sidebar";

const mapStateToProps = (state: stateType) => {
  return { mode: state.sidebar.mode, isCollapsed: state.sidebar.isCollapsed };
};
const actionCreator = {
  handleMode,
  handleSearch,
  handleDragToLove,
  handleDragToDelete,
  handleSortDisplay,
  handleCollapse,
};

export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(Sidebar as any));
