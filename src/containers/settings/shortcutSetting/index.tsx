import { connect } from "react-redux";
import ShortcutSetting from "./component";
import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";

export default connect(
  null,
  null
)(withTranslation()(withRouter(ShortcutSetting as any) as any) as any);
