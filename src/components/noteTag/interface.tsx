export interface NoteTagProps {
  isReading: boolean;
  isShowPopupNote: boolean;
  isEdit: boolean;
  noteKey: string;
  isCard: boolean;
  tag: string[];
  handleTag: (tag: string[]) => void;
}
export interface NoteTagState {
  tagIndex: number[];
  isInput: boolean;
  isShowTags: boolean;
  isEntered: boolean;
  deleteIndex: number;
}
