//我的书摘页面
import { connect } from "react-redux";
import { stateType } from "../../redux/store";
import { withNamespaces } from "react-i18next";
import DigestList from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    digests: state.reader.digests,
  };
};
const actionCreator = {};
export default connect(
  mapStateToProps,
  actionCreator
)(withNamespaces()(DigestList as any));
