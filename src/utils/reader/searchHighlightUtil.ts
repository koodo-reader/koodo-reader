import type { CSSProperties } from "react";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import {
  defaultSearchHighlightConfig,
  SearchHighlightConfig,
  SearchHighlightStyleType,
  searchHighlightPresetColors,
} from "../../constants/searchHighlightList";
import {
  buildTtsHighlightPreviewStyle,
  buildTtsHighlightStyleForType,
} from "./ttsHighlightUtil";

const SEARCH_HIGHLIGHT_STORE = "searchHighlightConfig";
const SEARCH_HIGHLIGHT_KEY = "global";

export function getSearchHighlightConfig(): SearchHighlightConfig {
  const stored = ConfigService.getObjectConfig(
    SEARCH_HIGHLIGHT_KEY,
    SEARCH_HIGHLIGHT_STORE,
    null
  ) as Partial<SearchHighlightConfig> | null;

  if (!stored) {
    return { ...defaultSearchHighlightConfig };
  }

  const styles = { ...defaultSearchHighlightConfig.styles };
  (Object.keys(styles) as SearchHighlightStyleType[]).forEach((type) => {
    if (stored.styles?.[type]) {
      styles[type] = {
        ...styles[type],
        ...stored.styles[type],
      };
    }
  });

  return {
    styleType: stored.styleType || defaultSearchHighlightConfig.styleType,
    styles,
  };
}

export function saveSearchHighlightConfig(config: SearchHighlightConfig): void {
  ConfigService.setObjectConfig(
    SEARCH_HIGHLIGHT_KEY,
    config,
    SEARCH_HIGHLIGHT_STORE
  );
}

export function getSearchHighlightColor(
  styleType: SearchHighlightStyleType,
  config?: SearchHighlightConfig
): string {
  const resolved = config || getSearchHighlightConfig();
  const entry = resolved.styles[styleType];
  if (entry.presetIndex >= 0) {
    return searchHighlightPresetColors[styleType][entry.presetIndex];
  }
  return entry.customColor;
}

export function buildSearchHighlightStyle(config?: SearchHighlightConfig): string {
  const resolved = config || getSearchHighlightConfig();
  const color = getSearchHighlightColor(resolved.styleType, resolved);
  return buildTtsHighlightStyleForType(resolved.styleType, color);
}

export function buildSearchHighlightPreviewStyle(
  styleType: SearchHighlightStyleType,
  color: string
): CSSProperties {
  return buildTtsHighlightPreviewStyle(styleType, color);
}
