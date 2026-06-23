import type { CSSProperties } from "react";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import {
  DEFAULT_HIGHLIGHT_VALUE,
  HighlightStyleType,
  SEARCH_HIGHLIGHT_CONFIG_KEY,
  TTS_HIGHLIGHT_CONFIG_KEY,
} from "../../constants/highlightList";

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

export function parseHighlightValue(raw?: string | null): HighlightValue {
  if (!raw) {
    return parseHighlightValue(DEFAULT_HIGHLIGHT_VALUE);
  }

  const dashIndex = raw.indexOf("-");
  if (dashIndex <= 0) {
    return parseHighlightValue(DEFAULT_HIGHLIGHT_VALUE);
  }

  const styleType = raw.slice(0, dashIndex) as HighlightStyleType;
  const color = raw.slice(dashIndex + 1);

  if (!VALID_STYLE_TYPES.has(styleType) || !color) {
    return parseHighlightValue(DEFAULT_HIGHLIGHT_VALUE);
  }

  return { styleType, color };
}

export function formatHighlightValue(
  styleType: HighlightStyleType,
  color: string
): string {
  return `${styleType}-${color}`;
}

function loadHighlightValue(configKey: string): HighlightValue {
  const raw = ConfigService.getReaderConfig(configKey);
  return parseHighlightValue(raw || DEFAULT_HIGHLIGHT_VALUE);
}

function saveHighlightValue(
  configKey: string,
  value: HighlightValue
): void {
  ConfigService.setReaderConfig(
    configKey,
    formatHighlightValue(value.styleType, value.color)
  );
}

export function getTtsHighlightValue(): HighlightValue {
  return loadHighlightValue(TTS_HIGHLIGHT_CONFIG_KEY);
}

export function saveTtsHighlightValue(value: HighlightValue): void {
  saveHighlightValue(TTS_HIGHLIGHT_CONFIG_KEY, value);
}

export function getSearchHighlightValue(): HighlightValue {
  return loadHighlightValue(SEARCH_HIGHLIGHT_CONFIG_KEY);
}

export function saveSearchHighlightValue(value: HighlightValue): void {
  saveHighlightValue(SEARCH_HIGHLIGHT_CONFIG_KEY, value);
}

export function buildHighlightStyleForType(
  styleType: HighlightStyleType,
  color: string
): string {
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
  const { styleType, color } = getTtsHighlightValue();
  return buildHighlightStyleForType(styleType, color);
}

export const buildTtsHighlightPreviewStyle = buildHighlightPreviewStyle;

export function buildSearchHighlightStyle(): string {
  const { styleType, color } = getSearchHighlightValue();
  return buildHighlightStyleForType(styleType, color);
}

export const buildSearchHighlightPreviewStyle = buildHighlightPreviewStyle;
