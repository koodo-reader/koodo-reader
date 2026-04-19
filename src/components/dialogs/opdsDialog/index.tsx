import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
import { stateType } from "../../../store";
import { handleOPDSDialog } from "../../../store/actions";
import OPDSDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    importBookFunc: state.book.importBookFunc,
  };
};

const actionCreator = {
  handleOPDSDialog,
};

export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(OPDSDialog as any) as any) as any);
