import type { CSSProperties } from "react";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import {
  DEFAULT_HIGHLIGHT_VALUE,
  DEFAULT_NOTE_HIGHLIGHT_VALUE,
  HighlightStyleType,
  NOTE_HIGHLIGHT_CONFIG_KEY,
  SEARCH_HIGHLIGHT_CONFIG_KEY,
  TTS_HIGHLIGHT_CONFIG_KEY,
} from "../../constants/highlightList";
import { classes, colors, lines } from "../../constants/themeList";

const VALID_STYLE_TYPES = new Set<HighlightStyleType>([
  "background",
  "underline",
  "strikethrough",
  "border",
]);

export interface HighlightValue {
  styleType: HighlightStyleType;
  color: string;
}

export function formatHighlightValue(value: HighlightValue): string {
  return `${value.styleType}-${value.color}`;
}

export function getNoteHighlightString(): string {
  return ConfigService.getReaderConfig(NOTE_HIGHLIGHT_CONFIG_KEY);
}

export function getNoteHighlightValue(): HighlightValue {
  const value = getNoteHighlightString();
  if (!value) {
    return DEFAULT_NOTE_HIGHLIGHT_VALUE;
  }
  const [styleType, color] = value.split("-");
  if (!VALID_STYLE_TYPES.has(styleType as HighlightStyleType)) {
    return DEFAULT_NOTE_HIGHLIGHT_VALUE;
  }
  return {
    styleType: styleType as HighlightStyleType,
    color,
  };
}

export function saveNoteHighlightValue(value: HighlightValue): void {
  ConfigService.setReaderConfig(
    NOTE_HIGHLIGHT_CONFIG_KEY,
    `${value.styleType}-${value.color}`
  );
}

export function getTtsHighlightString(): string {
  return ConfigService.getReaderConfig(TTS_HIGHLIGHT_CONFIG_KEY);
}
export function getTtsHighlightValue(): HighlightValue {
  const value = getTtsHighlightString();
  if (!value) {
    return DEFAULT_HIGHLIGHT_VALUE;
  }
  const [styleType, color] = value.split("-");
  if (!VALID_STYLE_TYPES.has(styleType as HighlightStyleType)) {
    return DEFAULT_HIGHLIGHT_VALUE;
  }
  return {
    styleType: styleType as HighlightStyleType,
    color,
  };
}

export function saveTtsHighlightValue(value: HighlightValue): void {
  ConfigService.setReaderConfig(
    TTS_HIGHLIGHT_CONFIG_KEY,
    `${value.styleType}-${value.color}`
  );
}
export function getSearchHighlightString(): string {
  return ConfigService.getReaderConfig(SEARCH_HIGHLIGHT_CONFIG_KEY);
}
export function getSearchHighlightValue(): HighlightValue {
  const colorCode = ConfigService.getReaderConfig(SEARCH_HIGHLIGHT_CONFIG_KEY);
  if (!colorCode) {
    return DEFAULT_HIGHLIGHT_VALUE;
  }
  const [styleType, color] = colorCode.split("-");
  if (!VALID_STYLE_TYPES.has(styleType as HighlightStyleType)) {
    return DEFAULT_HIGHLIGHT_VALUE;
  }
  return {
    styleType: styleType as HighlightStyleType,
    color,
  };
}

export function saveSearchHighlightValue(value: HighlightValue): void {
  ConfigService.setReaderConfig(
    SEARCH_HIGHLIGHT_CONFIG_KEY,
    `${value.styleType}-${value.color}`
  );
}

export function buildHighlightStyleForType(colorCode: string | number): string {
  console.log("buildHighlightStyleForType", colorCode);
  let styleType: string = "background";
  let color: string = "#FEF3CD";
  console.log(
    "colorCode",
    colorCode,
    typeof colorCode,
    typeof colorCode === "number"
  );
  if (typeof colorCode === "number") {
    if (colorCode >= 0 && colorCode < classes.length) {
      const isBackground = classes[colorCode].indexOf("color") > -1;
      const colorIdx = classes[colorCode].split("-")[1];
      styleType = isBackground ? "background" : "underline";
      color = isBackground ? colors[colorIdx] : lines[colorIdx];
      console.log("styleType", styleType, "color", color);
    }
  } else {
    styleType = colorCode.split("-")[0];
    color = colorCode.split("-")[1];
  }

  switch (styleType) {
    case "background":
      return `background: ${color};`;
    case "underline":
      return `border-bottom: 2px solid ${color};`;
    case "strikethrough":
      return `text-decoration: line-through; text-decoration-color: ${color};`;
    case "border":
      return `box-shadow: inset 0 0 0 2px ${color};`;
    default:
      return `background: ${color};`;
  }
}
export function buildHighlightPreviewStyle(
  styleType: HighlightStyleType,
  color: string
): CSSProperties {
  switch (styleType) {
    case "background":
      return { background: color };
    case "underline":
      return { borderBottom: `2px solid ${color}` };
    case "strikethrough":
      return {
        textDecoration: "line-through",
        textDecorationColor: color,
      };
    case "border":
      return { boxShadow: `inset 0 0 0 2px ${color}` };
    default:
      return { background: color };
  }
}

export function buildTtsHighlightStyle(): string {
  return buildHighlightStyleForType(getTtsHighlightString());
}

export const buildTtsHighlightPreviewStyle = buildHighlightPreviewStyle;

export function buildSearchHighlightStyle(): string {
  return buildHighlightStyleForType(getSearchHighlightString());
}

export const buildSearchHighlightPreviewStyle = buildHighlightPreviewStyle;
