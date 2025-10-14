import BookModel from "../../../models/Book";
export interface SliderListProps {
  currentBook: BookModel;
  item: any;
  renderBookFunc: () => void;
  t: (title: string) => string;
  scale: string;
  margin: number;
  handleScale: (scale: string) => void;
  handleMargin: (margin: string) => void;
}
export interface SliderListState {
  inputValue: string;
  isTyping: boolean;
  isEntered: boolean;
  fontSize: string;
  letterSpacing: string;
  paraSpacing: string;
  brightness: string;
  scale: string;
  margin: string;
}
