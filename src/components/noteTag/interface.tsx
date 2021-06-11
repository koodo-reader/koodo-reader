export interface NoteTagProps {
  isReading: boolean;
  noteKey: string;
  isCard: boolean;
  tag: string[];
  handleTag: (tag: string[]) => void;
}
export interface NoteTagState {
  tagIndex: number[];
  isInput: boolean;
  isShowTags: boolean;
  deleteIndex: number;
}
