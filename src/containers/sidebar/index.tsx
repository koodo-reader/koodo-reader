import {
  handleMode,
  handleSearch,
  handleSortDisplay,
  handleCollapse,
  handleSelectBook,
} from "../../store/actions";
import { connect } from "react-redux";
import { stateType } from "../../store";
import { withTranslation } from "react-i18next";
import Sidebar from "./component";

const mapStateToProps = (state: stateType) => {
  return { mode: state.sidebar.mode, isCollapsed: state.sidebar.isCollapsed };
};
const actionCreator = {
  handleMode,
  handleSearch,
  handleSortDisplay,
  handleCollapse,
  handleSelectBook,
};

export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(Sidebar as any));
