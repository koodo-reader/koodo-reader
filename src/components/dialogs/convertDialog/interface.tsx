import BookModel from "../../../models/Book";
import PluginModel from "../../../models/Plugin";

export interface ConvertDialogProps {
  isSettingOpen: boolean;
  isAboutOpen: boolean;


}
export interface ConvertDialogState {

  isConvertPDF: boolean;
}
