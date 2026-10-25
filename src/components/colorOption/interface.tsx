import Note from "../../models/Note";
import { HighlightValue } from "../../utils/common";

export interface ColorProps {
  noteItem?: Note;
  isEdit: boolean;
  handleDigest: () => void;
}
