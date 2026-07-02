import Note from "../../models/Note";
import { HighlightValue } from "../../utils/common";

export interface ColorProps {
  highlight: HighlightValue;
  noteItem?: Note;
  isEdit: boolean;
  handleHighlight: (value: HighlightValue) => void;
  handleDigest: () => void;
}
