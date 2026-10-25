export interface NoteTagProps {
  isEdit: boolean;

  isCard: boolean;
  tag: string[];
  handleTag: (tag: string[]) => void;
}
