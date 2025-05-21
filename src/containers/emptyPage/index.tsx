import { connect } from "react-redux";
import { stateType } from "../../store";
import EmptyPage from "./component";
import { withTranslation } from "react-i18next";
import { handleMode, handleShelf } from "../../store/actions";
import { withRouter } from "react-router-dom";
const mapStateToProps = (state: stateType) => {
  return {
    mode: state.sidebar.mode,
    isCollapsed: state.sidebar.isCollapsed,
    shelfTitle: state.sidebar.shelfTitle,
    isSelectBook: state.manager.isSelectBook,
  };
};
const actionCreator = { handleMode, handleShelf };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(EmptyPage as any) as any) as any);
