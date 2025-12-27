import NoteModel from "../../../models/Note";

export interface NoteListProps {
  notes: NoteModel[];
  highlights: NoteModel[];

  isSearch: boolean;
  isCollapsed: boolean;
  searchResults: number[];
  tabMode: string;
  handleFetchNotes: () => void;
  t: (title: string) => string;
}
export interface NoteListState {
  tag: string[];
  currentSelectedBook: string;
  bookNamesMap: { [key: string]: string };
  cardList: NoteModel[];
}
