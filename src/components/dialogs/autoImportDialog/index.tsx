import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
import { stateType } from "../../../store";
import {
  handleAutoImportDialog,
  handleFetchBooks,
} from "../../../store/actions";
import AutoImportDialog from "./component";
import { isElectron } from "react-device-detect";

const mapStateToProps = (state: stateType) => {
  return {
    isElectron,
    books: state.manager.books,
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
