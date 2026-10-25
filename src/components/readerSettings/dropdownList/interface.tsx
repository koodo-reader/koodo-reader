import BookModel from "../../../models/Book";

export interface DropdownListProps {

  group?: string;

}
export interface DropdownListState {
  currentFontFamilyValue: string;
  currentSubFontFamilyValue: string;
  currentLineHeightValue: string;
  currentTextAlignValue: string;
  currentBookLayoutValue: string;
  currentCodeHighlighterValue: string;
  chineseConversionValue: string;
  currentAnimationValue: string;
  currentTextOrientationValue: string;
  currentSelectActionValue: string;
  currentTxtParserValue: string;
  txtParserOptions: { label: string; value: string }[];
  fontOptions: { label: string; value: string }[];
}
