import type { CSSProperties } from "react";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import {
  DEFAULT_HIGHLIGHT_VALUE,
  DEFAULT_NOTE_HIGHLIGHT_VALUE,
  NOTE_HIGHLIGHT_CONFIG_KEY,
  SEARCH_HIGHLIGHT_CONFIG_KEY,
  TTS_HIGHLIGHT_CONFIG_KEY,
} from "../../constants/highlightList";
import { classes, colors, lines } from "../../constants/themeList";

export interface HighlightValue {
  styleType: string;
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
  return {
    styleType: styleType,
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
  return {
    styleType: styleType,
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
  return {
    styleType: styleType,
    color,
  };
}

export function saveSearchHighlightValue(value: HighlightValue): void {
  ConfigService.setReaderConfig(
    SEARCH_HIGHLIGHT_CONFIG_KEY,
    `${value.styleType}-${value.color}`
  );
}
const hexToRgba = (hexColor: string, alpha: number): string => {
  const hex = hexColor.replace("#", "");
  const isShort = hex.length === 3;
  const normalized = isShort
    ? hex
        .split("")
        .map((ch) => ch + ch)
        .join("")
    : hex;
  if (normalized.length !== 6) return hexColor;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
export function buildHighlightStyleForType(
  colorCode: string | number,
  forPDFOverlay: boolean
): string {
  let styleType: string = "background";
  let rawColor: string = "#FEF3CD";
  if (typeof colorCode === "number") {
    if (colorCode >= 0 && colorCode < classes.length) {
      const isBackground = classes[colorCode].indexOf("color") > -1;
      const colorIdx = classes[colorCode].split("-")[1];
      styleType = isBackground ? "background" : "underline";
      rawColor = isBackground ? colors[colorIdx] : lines[colorIdx];
    }
  } else {
    styleType = colorCode.split("-")[0];
    rawColor = colorCode.split("-")[1];
  }
  // color is the processed value used for non-overlay cases
  const color =
    styleType === "background" ? hexToRgba(rawColor, 0.8) : rawColor;

  switch (styleType) {
    case "background":
      if (forPDFOverlay) {
        // Use multiply blend mode so the highlight tints the text area without
        // covering it — the same visual effect as a physical highlighter pen.
        // Fully opaque color is intentional: mix-blend-mode: multiply handles
        // the visual blending; alpha transparency is not needed and would fight it.
        return `background: ${rawColor}; mix-blend-mode: multiply;`;
      }
      return `background: ${color};`;
    case "underline":
      return `border-bottom: 2px solid ${color};`;
    case "strikethrough":
      if (forPDFOverlay) {
        // text-decoration doesn't render on empty divs; simulate with a gradient line through the middle
        return `background: linear-gradient(transparent calc(50% - 1px), ${color} calc(50% - 1px), ${color} calc(50% + 1px), transparent calc(50% + 1px));`;
      }
      return `text-decoration: line-through; text-decoration-color: ${color};`;
    case "wavy":
      if (forPDFOverlay) {
        // text-decoration doesn't render on empty divs; simulate with a repeating SVG wavy line at the bottom
        const encodedColor = rawColor.replace("#", "%23");
        const svgWavy = `url("data:image/svg+xml,%3Csvg xmlns='http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg' width='6' height='3'%3E%3Cpath d='M0 2 Q1.5 0 3 2 Q4.5 4 6 2' fill='none' stroke='${encodedColor}' stroke-width='1.5'%2F%3E%3C%2Fsvg%3E")`;
        return `background-image: ${svgWavy}; background-repeat: repeat-x; background-position: bottom; background-size: 6px 3px;`;
      }
      return `text-decoration-line: underline; text-decoration-style: wavy; text-decoration-color: ${color}; text-decoration-thickness: 2px; text-decoration-skip-ink: none;`;
    default:
      return `background: ${color};`;
  }
}
export function buildHighlightPreviewStyle(
  styleType: string,
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
    case "wavy":
      return {
        textDecorationLine: "underline",
        textDecorationStyle: "wavy",
        textDecorationColor: color,
        textDecorationThickness: "2px",
        textDecorationSkipInk: "none",
      };
    default:
      return { background: color };
  }
}

export function buildTtsHighlightStyle(forPDFOverlay: boolean): string {
  return buildHighlightStyleForType(getTtsHighlightString(), forPDFOverlay);
}

export const buildTtsHighlightPreviewStyle = buildHighlightPreviewStyle;

export function buildSearchHighlightStyle(forPDFOverlay: boolean): string {
  return buildHighlightStyleForType(getSearchHighlightString(), forPDFOverlay);
}

export const buildSearchHighlightPreviewStyle = buildHighlightPreviewStyle;
