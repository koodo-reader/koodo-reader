import Book from "../../../models/Book";

export interface ThemeListProps {
  t: (title: string) => string;
  currentBook: Book;
  renderBookFunc: () => void;
  handleBackgroundColor: (color: string) => void;
}

export interface ThemeListState {
  currentBackgroundIndex: number;
  currentTextIndex: number;
  isShowTextPicker: boolean;
  isShowBgPicker: boolean;
}
