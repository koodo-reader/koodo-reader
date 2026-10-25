import HtmlBookModel from "../../../models/HtmlBook";

export interface SliderListProps {
  item: any;

}
export interface SliderListState {
  inputValue: string;
  isTyping: boolean;
  isEntered: boolean;
  fontSize: string;
  letterSpacing: string;
  paraSpacing: string;
  brightness: string;
  margin: string;
  readingRulerLineHeight?: string;
  readingRulerBackgroundOpacity?: string;
  speedReadingSpeed?: string;
  autoScrollRate?: string;
}
