import NoteModel from "../../model/Note";

export interface NoteListProps {
  notes: NoteModel[];
  isSearch:boolean;
  searchResults: number[];
}
export interface NoteListState {}
