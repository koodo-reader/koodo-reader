import { handleMode } from "../../store/actions/sidebar";
import { connect } from "react-redux";
import { stateType } from "../../store";
import { withNamespaces } from "react-i18next";
import Sidebar from "./component";
import { handleSearch } from "../../store/actions/manager";
import {
  handleDragToLove,
  handleDragToDelete,
} from "../../store/actions/sidebar";

const mapStateToProps = (state: stateType) => {
  return { mode: state.sidebar.mode };
};
const actionCreator = {
  handleMode,
  handleSearch,
  handleDragToLove,
  handleDragToDelete,
};

export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(Sidebar as any));
