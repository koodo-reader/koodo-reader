//字体大小选择页面
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import SliderList from "./component";
import {
  handleMessageBox,
  handleMessage,
} from "../../../store/actions/manager";
import { stateType } from "../../../store";

const mapStateToProps = (state: stateType) => {
  return { currentEpub: state.book.currentEpub };
};
const actionCreator = {
  handleMessageBox,
  handleMessage,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(SliderList as any));
