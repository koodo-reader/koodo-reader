import BookModel from "../../../models/Book";
export interface SliderListProps {
  currentBook: BookModel;
  renderBookFunc: () => void;
  t: (title: string) => string;
}
export interface SliderListState {
  inputValue: string;
  isTyping: boolean;
  isEntered: boolean;
  fontSize: string;
  scale: string;
  letterSpacing: string;
  paraSpacing: string;
  brightness: string;
  margin: string;
}
