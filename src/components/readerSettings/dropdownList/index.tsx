import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import DropdownList from "./component";
import { stateType } from "../../../store";
import {
  handleHideBackground,
  handleTextOrientation,
} from "../../../store/actions";

const mapStateToProps = (state: stateType) => {
  return {
    renderBookFunc: state.book.renderBookFunc,
  };
};
const actionCreator = { handleHideBackground, handleTextOrientation };
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(DropdownList as any) as any);
