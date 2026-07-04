import { connect } from "react-redux";
import TextSetting from "./component";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return {
    books: state.manager.books || [],
  };
};

const actionCreator = {};

export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(TextSetting as any) as any) as any);
