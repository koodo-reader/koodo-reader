import BookModel from "../../../models/Book";
import HtmlBookModel from "../../../models/HtmlBook";

export interface StudyLangDialogState {
  fullTranslationModeValue: string;
  fullTranslationTargetValue: string;
  isWordDefinition: boolean;
  wordDefinitionLang: string;
  currentChineseLevel: string;
  currentJapaneseLevel: string;
  currentEnglishLevel: string;
}
