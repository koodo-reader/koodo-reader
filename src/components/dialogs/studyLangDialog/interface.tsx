import BookModel from "../../../models/Book";
import HtmlBookModel from "../../../models/HtmlBook";

export interface StudyLangDialogProps {
  currentBook: BookModel;
  htmlBook: HtmlBookModel | null;
  isAuthed: boolean;


  t: (title: string) => string;
  handleStudyLangDialog: (isStudyLangOpen: boolean) => void;
  handleSetting: (isSettingOpen: boolean) => void;
  handleSettingMode: (mode: string) => void;
  renderBookFunc: () => void;
}

export interface StudyLangDialogState {
  fullTranslationModeValue: string;
  fullTranslationTargetValue: string;
  isWordDefinition: boolean;
  wordDefinitionLang: string;
  currentChineseLevel: string;
  currentJapaneseLevel: string;
  currentEnglishLevel: string;
}
