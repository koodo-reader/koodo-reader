import { connect } from "react-redux";
import { handlePdfCropDialog } from "../../../store/actions";
import { stateType } from "../../../store";
import PdfCropDialog from "./component";
import { withTranslation } from "react-i18next";

const mapStateToProps = (state: stateType) => {
  return {
    isPdfCropOpen: state.reader.isPdfCropOpen,
    currentBook: state.book.currentBook,
    isSettingLocked: state.reader.isSettingLocked,
  };
};
const actionCreator = {
  handlePdfCropDialog,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(PdfCropDialog as any) as any);
