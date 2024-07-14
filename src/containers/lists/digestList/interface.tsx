import NoteModel from "../../../models/Note";

export interface DigestListProps {
  digests: NoteModel[];
  isSearch: boolean;
  isCollapsed: boolean;
  searchResults: number[];
  handleFetchNotes: () => void;
}
export interface DigestListStates {
  tag: string[];
}
