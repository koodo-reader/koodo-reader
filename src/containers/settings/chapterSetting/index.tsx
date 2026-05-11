import { connect } from "react-redux";
import ChapterSetting from "./component";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";

const mapStateToProps = () => {
  return {};
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(withRouter(ChapterSetting as any) as any) as any);
