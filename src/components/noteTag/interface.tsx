export interface NoteTagProps {
  isReading: boolean;
  noteKey: string;
  tag: string[];
  handleTag: (tag: string[]) => void;
}
export interface NoteTagState {
  tagIndex: number[];
  isInput: boolean;
  deleteIndex: number;
}
