import NoteModel from "../../../models/Note";

export interface NoteListProps {
  notes: NoteModel[];
  isSearch: boolean;
  isCollapsed: boolean;
  searchResults: number[];
  handleFetchNotes: () => void;
}
export interface NoteListState {
  tag: string[];
}
