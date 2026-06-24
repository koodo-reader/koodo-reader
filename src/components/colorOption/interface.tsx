import { HighlightValue } from "../../utils/reader/highlightUtil";

export interface ColorProps {
  highlight: HighlightValue;
  isEdit: boolean;
  handleHighlight: (value: HighlightValue) => void;
  handleDigest: () => void;
}
