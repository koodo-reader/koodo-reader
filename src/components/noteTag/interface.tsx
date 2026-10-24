export interface NoteTagProps {
  isReading: boolean;
  isShowPopupNote: boolean;
  isEdit: boolean;

  isCard: boolean;
  tag: string[];
  handleTag: (tag: string[]) => void;
}
export interface NoteTagState {
  tagIndex: number[];
  isInput: boolean;
  isEntered: boolean;
}
