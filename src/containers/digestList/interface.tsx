import NoteModel from "../../model/Note";

export interface DigestListProps {
  digests: NoteModel[];
  isSearch: boolean;
  searchResults: number[];
  handleFetchNotes: () => void;
}
export interface DigestListStates {
  tag: string[];
}
