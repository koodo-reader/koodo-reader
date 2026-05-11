import { withTranslation } from "react-i18next";
import { withRouter } from "react-router-dom";
import Stats from "./component";

export default withTranslation()(withRouter(Stats as any) as any) as any;
