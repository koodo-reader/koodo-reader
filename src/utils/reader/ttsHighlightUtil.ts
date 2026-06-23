import type { CSSProperties } from "react";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import {
  defaultTtsHighlightConfig,
  TtsHighlightConfig,
  TtsHighlightStyleType,
  ttsHighlightPresetColors,
} from "../../constants/ttsHighlightList";

const TTS_HIGHLIGHT_STORE = "ttsHighlightConfig";
const TTS_HIGHLIGHT_KEY = "global";

export function getTtsHighlightConfig(): TtsHighlightConfig {
  const stored = ConfigService.getObjectConfig(
    TTS_HIGHLIGHT_KEY,
    TTS_HIGHLIGHT_STORE,
    null
  ) as Partial<TtsHighlightConfig> | null;

  if (!stored) {
    return { ...defaultTtsHighlightConfig };
  }

  const styles = { ...defaultTtsHighlightConfig.styles };
  (Object.keys(styles) as TtsHighlightStyleType[]).forEach((type) => {
    if (stored.styles?.[type]) {
      styles[type] = {
        ...styles[type],
        ...stored.styles[type],
      };
    }
  });

  return {
    styleType: stored.styleType || defaultTtsHighlightConfig.styleType,
    styles,
  };
}

export function saveTtsHighlightConfig(config: TtsHighlightConfig): void {
  ConfigService.setObjectConfig(
    TTS_HIGHLIGHT_KEY,
    config,
    TTS_HIGHLIGHT_STORE
  );
}

export function getTtsHighlightColor(
  styleType: TtsHighlightStyleType,
  config?: TtsHighlightConfig
): string {
  const resolved = config || getTtsHighlightConfig();
  const entry = resolved.styles[styleType];
  if (entry.presetIndex >= 0) {
    return ttsHighlightPresetColors[styleType][entry.presetIndex];
  }
  return entry.customColor;
}

export function buildTtsHighlightStyleForType(
  styleType: TtsHighlightStyleType,
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

export function buildTtsHighlightStyle(config?: TtsHighlightConfig): string {
  const resolved = config || getTtsHighlightConfig();
  const color = getTtsHighlightColor(resolved.styleType, resolved);
  return buildTtsHighlightStyleForType(resolved.styleType, color);
}

export function buildTtsHighlightPreviewStyle(
  styleType: TtsHighlightStyleType,
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
