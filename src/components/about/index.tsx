//左下角的图标外链
import { connect } from "react-redux";
import { handleMessageBox, handleMessage } from "../../redux/actions/manager";
import About from "./component";
const actionCreator = { handleMessageBox, handleMessage };
export default connect(null, actionCreator)(About);
