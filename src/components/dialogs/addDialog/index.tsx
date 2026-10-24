import { connect } from "../../../store/legacyConnect";
import {
  handleAddDialog,
  handleActionDialog,
  handleMode,
  handleShelf,
  handleSelectBook,
  handleSelectedBooks,
} from "../../../store/actions";
import { stateType } from "../../../store";
import { withTranslation } from "react-i18next";
import AddDialog from "./component";

const mapStateToProps = (state: stateType) => {
  return {
    selectedBooks: state.manager.selectedBooks,
    isSelectBook: state.manager.isSelectBook,
    currentBook: state.book.currentBook,

    mode: state.sidebar.mode,
    shelfTitle: state.sidebar.shelfTitle,
  };
};
const actionCreator = {
  handleAddDialog,
  handleActionDialog,
  handleSelectBook,
  handleMode,
  handleShelf,
  handleSelectedBooks,
};
export default connect(
  mapStateToProps,
  actionCreator
)(withTranslation()(AddDialog as any) as any);
