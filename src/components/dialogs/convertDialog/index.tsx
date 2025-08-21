import { connect } from "react-redux";
import { handleSetting, handleConvertDialog } from "../../../store/actions";
import { stateType } from "../../../store";
import ConvertDialog from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    isConvertOpen: state.reader.isConvertOpen,
    currentBook: state.book.currentBook,
  };
};
const actionCreator = {
  handleSetting,
  handleConvertDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(ConvertDialog as any) as any);
