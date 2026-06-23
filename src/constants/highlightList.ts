export type HighlightStyleType =
  | "background"
  | "underline"
  | "strikethrough"
  | "border";

export interface HighlightStyleEntry {
  presetIndex: number;
  customColor: string;
}

export interface HighlightConfig {
  styleType: HighlightStyleType;
  styles: Record<HighlightStyleType, HighlightStyleEntry>;
}

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
  background: [
    "#f3a6a68c",
    "#FBF1D1CC",
    "#EFEEB0CC",
    "#CAEFC9CC",
    "#76BEE9CC",
  ],
  underline: ["#F16464", "#0179CA", "#008F91", "#6867D1", "#F97316"],
  strikethrough: ["#F16464", "#0179CA", "#008F91", "#6867D1", "#F97316"],
  border: ["#F16464", "#0179CA", "#008F91", "#6867D1", "#F97316"],
};

export const defaultHighlightConfig: HighlightConfig = {
  styleType: "background",
  styles: {
    background: { presetIndex: 0, customColor: "#f3a6a68c" },
    underline: { presetIndex: 0, customColor: "#F16464" },
    strikethrough: { presetIndex: 0, customColor: "#F16464" },
    border: { presetIndex: 0, customColor: "#F16464" },
  },
};
