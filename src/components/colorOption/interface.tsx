import Note from "../../models/Note";
import { HighlightValue } from "../../utils/reader/highlightUtil";

export interface ColorProps {
  highlight: HighlightValue;
  noteItem?: Note;
  isEdit: boolean;
  handleHighlight: (value: HighlightValue) => void;
  handleDigest: () => void;
}
