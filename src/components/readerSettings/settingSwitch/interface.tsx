import BookModel from "../../../models/Book";
import PluginModel from "../../../models/Plugin";
import HtmlBookModel from "../../../models/HtmlBook";
export interface SettingSwitchProps {
  currentBook: BookModel;
  htmlBook: HtmlBookModel;
  plugins: PluginModel[];
  renderBookFunc: () => void;
  handleHideFooter: (isHideFooter: boolean) => void;
  handleHideHeader: (isHideHeader: boolean) => void;
  t: (title: string) => string;
  handleHideBackground: (isHideBackground: boolean) => void;
  handleHidePageButton: (isHidePageButton: boolean) => void;
  handleHideMenuButton: (isHideMenuButton: boolean) => void;
  handleHideAIButton: (isHideAIButton: boolean) => void;
  handleHideScaleButton: (isHideScaleButton: boolean) => void;
  handleHidePDFConvertButton: (isHidePDFConvertButton: boolean) => void;
}
export interface SettingSwitchState {
  isHideBackground: boolean;
  isHideFooter: boolean;
  isBold: boolean;
  isIndent: boolean;
  isSliding: boolean;
  isShadow: boolean;
  isUnderline: boolean;
  isItalic: boolean;
  isInvert: boolean;
  isStartFromEven: boolean;
  isHideHeader: boolean;
  isHidePageButton: boolean;
  isHideAIButton: boolean;
  isHideScaleButton: boolean;
  isHidePDFConvertButton: boolean;
  isHideMenuButton: boolean;
}
