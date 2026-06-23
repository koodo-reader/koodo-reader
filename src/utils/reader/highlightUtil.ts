import type { CSSProperties } from "react";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import {
  defaultHighlightConfig,
  HighlightConfig,
  HighlightStyleType,
  highlightPresetColors,
} from "../../constants/highlightList";

const HIGHLIGHT_KEY = "global";
export const TTS_HIGHLIGHT_STORE = "ttsHighlightConfig";
export const SEARCH_HIGHLIGHT_STORE = "searchHighlightConfig";

export function getHighlightConfig(
  storeKey: string,
  storeName: string,
  defaults: HighlightConfig
): HighlightConfig {
  const stored = ConfigService.getObjectConfig(
    storeKey,
    storeName,
    null
  ) as Partial<HighlightConfig> | null;

  if (!stored) {
    return { ...defaults };
  }

  const styles = { ...defaults.styles };
  (Object.keys(styles) as HighlightStyleType[]).forEach((type) => {
    if (stored.styles?.[type]) {
      styles[type] = {
        ...styles[type],
        ...stored.styles[type],
      };
    }
  });

  return {
    styleType: stored.styleType || defaults.styleType,
    styles,
  };
}

export function saveHighlightConfig(
  storeKey: string,
  storeName: string,
  config: HighlightConfig
): void {
  ConfigService.setObjectConfig(storeKey, config, storeName);
}

export function getHighlightColor(
  styleType: HighlightStyleType,
  config: HighlightConfig,
  presetColors: Record<HighlightStyleType, string[]> = highlightPresetColors
): string {
  const entry = config.styles[styleType];
  if (entry.presetIndex >= 0) {
    return presetColors[styleType][entry.presetIndex];
  }
  return entry.customColor;
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

export function buildHighlightStyle(
  config: HighlightConfig | undefined,
  getConfig: () => HighlightConfig,
  presetColors: Record<HighlightStyleType, string[]> = highlightPresetColors
): string {
  const resolved = config || getConfig();
  const color = getHighlightColor(resolved.styleType, resolved, presetColors);
  return buildHighlightStyleForType(resolved.styleType, color);
}

export function getTtsHighlightConfig(): HighlightConfig {
  return getHighlightConfig(
    HIGHLIGHT_KEY,
    TTS_HIGHLIGHT_STORE,
    defaultHighlightConfig
  );
}

export function saveTtsHighlightConfig(config: HighlightConfig): void {
  saveHighlightConfig(HIGHLIGHT_KEY, TTS_HIGHLIGHT_STORE, config);
}

export function getTtsHighlightColor(
  styleType: HighlightStyleType,
  config?: HighlightConfig
): string {
  const resolved = config || getTtsHighlightConfig();
  return getHighlightColor(styleType, resolved, highlightPresetColors);
}

export function buildTtsHighlightStyle(config?: HighlightConfig): string {
  return buildHighlightStyle(config, getTtsHighlightConfig, highlightPresetColors);
}

export const buildTtsHighlightPreviewStyle = buildHighlightPreviewStyle;

export function getSearchHighlightConfig(): HighlightConfig {
  return getHighlightConfig(
    HIGHLIGHT_KEY,
    SEARCH_HIGHLIGHT_STORE,
    defaultHighlightConfig
  );
}

export function saveSearchHighlightConfig(config: HighlightConfig): void {
  saveHighlightConfig(HIGHLIGHT_KEY, SEARCH_HIGHLIGHT_STORE, config);
}

export function getSearchHighlightColor(
  styleType: HighlightStyleType,
  config?: HighlightConfig
): string {
  const resolved = config || getSearchHighlightConfig();
  return getHighlightColor(styleType, resolved, highlightPresetColors);
}

export function buildSearchHighlightStyle(config?: HighlightConfig): string {
  return buildHighlightStyle(
    config,
    getSearchHighlightConfig,
    highlightPresetColors
  );
}

export const buildSearchHighlightPreviewStyle = buildHighlightPreviewStyle;
