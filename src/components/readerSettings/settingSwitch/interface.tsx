import BookModel from "../../../models/Book";
import PluginModel from "../../../models/Plugin";
import HtmlBookModel from "../../../models/HtmlBook";
export interface SettingSwitchProps {
  currentBook: BookModel;
  htmlBook: HtmlBookModel | null;
  plugins: PluginModel[];
  isAuthed?: boolean;
  renderBookFunc: () => void;
  handleHideFooter: (isHideFooter: boolean) => void;
  handleHideHeader: (isHideHeader: boolean) => void;
  t: (title: string) => string;
  handleHideBackground: (isHideBackground: boolean) => void;
  handleShowBorder: (isShowPageBorder: boolean) => void;
  handleSetting: (isOpenSetting: boolean) => void;
  handleSettingMode: (mode: string) => void;
  handleBackgroundColor: (color: string) => void;
}
export interface SettingSwitchState {
  isHideBackground: boolean;
  isHideFooter: boolean;
  isBold: boolean;
  isIndent: boolean;
  isShadow: boolean;
  isUnderline: boolean;
  isItalic: boolean;
  isInvert: boolean;
  isStartFromEven: boolean;
  isAllowScript: boolean;
  isHyphenation: boolean;
  isOrphanWidow: boolean;
  isKeepPDFBackground: boolean;
  isBionic: boolean;
  isHideHeader: boolean;
  isShowPageBorder: boolean;
  isCustomBookCSS: boolean;
  customBookCSS: string;
  isWordDefinition: boolean;
  isSeperateStyle: boolean;
  wordDefinitionLang: string;
  currentChineseLevel: string;
  currentJapaneseLevel: string;
  currentEnglishLevel: string;
}
