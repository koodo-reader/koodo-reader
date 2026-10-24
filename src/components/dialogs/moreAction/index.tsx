import { connect } from "../../../store/legacyConnect";
import {
  handleActionDialog,
} from "../../../store/actions";

import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import MoreAction from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    currentBook: state.book.currentBook,
  };
};
const actionCreator = {
  handleActionDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(MoreAction as any) as any);
