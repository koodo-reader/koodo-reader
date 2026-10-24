import { connect } from "../../../store/legacyConnect";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
import { stateType } from "../../../store";
import {
  handleAutoImportDialog,
  handleFetchBooks,
} from "../../../store/actions";
import AutoImportDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    importBookFunc: state.book.importBookFunc,
  };
};

const actionCreator = {
  handleAutoImportDialog,
  handleFetchBooks,
};

export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(AutoImportDialog as any) as any) as any);
