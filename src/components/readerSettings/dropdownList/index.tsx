import { connect } from "../../../store/legacyConnect";
import { withTranslation } from "react-i18next";
import DropdownList from "./component";
import { stateType } from "../../../store";
import {
  handleTextOrientation,
  handleSetting,
  handleSettingMode,
} from "../../../store/actions";

const mapStateToProps = (state: stateType) => {
  return {
    renderBookFunc: state.book.renderBookFunc,
    currentBook: state.book.currentBook,
  };
};
const actionCreator = {
  handleTextOrientation,
  handleSetting,
  handleSettingMode,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(DropdownList as any) as any);
