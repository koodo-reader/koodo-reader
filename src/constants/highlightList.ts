import { HighlightValue } from "../utils/reader/highlightUtil";

export type HighlightStyleType =
  | "background"
  | "underline"
  | "strikethrough"
  | "border";

export const highlightStyleTypes: {
  value: HighlightStyleType;
  label: string;
}[] = [
  { value: "background", label: "Highlight background" },
  { value: "underline", label: "Underline" },
  { value: "strikethrough", label: "Strikethrough" },
  { value: "border", label: "Highlight border" },
];

export const highlightPresetColors: Record<HighlightStyleType, string[]> = {
  background: ["#f3a6a68c", "#FEF3CD", "#FBFACC", "#CEFACD", "#CDE9FA"],
  underline: ["#FF0000", "#000080", "#0000FF", "#2EFF2E"],
  strikethrough: ["#FF0000", "#000080", "#0000FF", "#2EFF2E"],
  border: ["#FF0000", "#000080", "#0000FF", "#2EFF2E"],
};

export const DEFAULT_HIGHLIGHT_STRING = "background-#f3a6a68c";
export const DEFAULT_HIGHLIGHT_VALUE: HighlightValue = {
  styleType: "background",
  color: "#f3a6a68c",
};
export const TTS_HIGHLIGHT_CONFIG_KEY = "ttsHighlight";
export const SEARCH_HIGHLIGHT_CONFIG_KEY = "searchHighlight";
