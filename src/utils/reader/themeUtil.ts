import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

// CSS selectors grouped by style rule
const BG_SOLID_SELECTORS = [
  ".delete-digest-button",
  ".add-dialog-confirm",
  ".backup-page-backup-selector",
  ".delete-dialog-confirm",
  ".book-item-config",
  ".book-cover-item-config",
  ".download-desk-button",
  ".edit-dialog-confirm",
  ".change-location-button",
  ".token-dialog-confirm",
  ".voice-add-confirm",
  ".new-version-open",
  ".update-dialog-container-button",
  ".import-from-local",
  ".single-control-switch",
  ".side-menu-selector-container",
  ".previous-chapter-single-container",
  ".next-chapter-single-container",
  ".book-bookmark-link",
  ".message-box-container",
  ".only-local-icon",
];

const TEXT_080_SELECTORS = [
  ".header-search-box",
  ".header-search-box::placeholder",
  ".feedback-dialog-content-box::placeholder",
  ".header-search-text",
  ".card-list-item-show-more",
];

const TEXT_SOLID_SELECTORS = [".single-control-container", ".book-list-view"];

const BG_010_SELECTORS = [
  ".header-search-box",
  "#jumpPage",
  "#jumpChapter",
  "#newTag",
];

const BG_HOVER_SELECTORS = [
  ".backup-page-close-icon:hover",
  ".sidebar-list-icon:hover",
  ".nav-close-icon:hover",
  ".setting-close-container:hover",
  ".side-menu-hover-container",
  ".setting-dialog-location-title",
  ".header-search-text:hover",
  ".reader-setting-icon-container:hover",
  ".setting-icon-container:hover",
  ".animation-mask",
  ".animation-mask-local",
  ".copy-option:hover",
];

const BORDER_SELECTORS = [
  ".book-content-name",
  ".book-subcontent-name",
  ".book-bookmark-list",
  ".nav-search-list-item",
  ".sort-dialog-seperator",
];

const STYLE_ELEMENT_ID = "dynamic-theme-color";

/**
 * Parse color string (hex or rgba) to RGB components
 */
function parseColor(color: string): { r: number; g: number; b: number } {
  // Handle hex format: #RRGGBB or #RGB
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  // Handle rgba/rgb format: rgba(R,G,B,A) or rgb(R,G,B)
  const match = color.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/
  );
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
    };
  }

  // Fallback to default blue
  return { r: 75, g: 75, b: 75 };
}

/**
 * Generate complete theme CSS string from a color value
 */
export function generateThemeCSS(color: string): string {
  const { r, g, b } = parseColor(color);

  return [
    `${BG_SOLID_SELECTORS.join(",\n")} {\n  background-color: rgba(${r}, ${g}, ${b}, 1) !important;\n}`,
    `${TEXT_080_SELECTORS.join(",\n")} {\n  color: rgba(${r}, ${g}, ${b}, 0.8) !important;\n}`,
    `${TEXT_SOLID_SELECTORS.join(",\n")} {\n  color: rgba(${r}, ${g}, ${b}, 1) !important;\n}`,
    `${BG_010_SELECTORS.join(",\n")} {\n  background-color: rgba(${r}, ${g}, ${b}, 0.1) !important;\n}`,
    `${BG_HOVER_SELECTORS.join(",\n")} {\n  background-color: rgba(${r}, ${g}, ${b}, 0.035) !important;\n}`,
    `${BORDER_SELECTORS.join(",\n")} {\n  border-bottom: 1px solid rgba(${r}, ${g}, ${b}, 0.1) !important;\n}`,
  ].join("\n\n");
}

/**
 * Apply theme color by injecting dynamic CSS into document head
 */
export function applyThemeColor(color: string): void {
  const css = generateThemeCSS(color);
  let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement;

  if (styleEl) {
    styleEl.textContent = css;
  } else {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ELEMENT_ID;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }
}

/**
 * Remove dynamic theme color style element
 */
export function removeThemeColor(): void {
  const styleEl = document.getElementById(STYLE_ELEMENT_ID);
  if (styleEl) {
    styleEl.remove();
  }
}

// Old name → new hex color mapping for config migration
const LEGACY_COLOR_MAP: Record<string, string> = {
  blue: "#0179CA",
  green: "#008F91",
  red: "#F16464",
  purple: "#6867D1",
};

/**
 * Migrate legacy theme config (color name → hex value)
 * Should be called once at app startup
 */
export function migrateThemeConfig(): void {
  const current = ConfigService.getReaderConfig("themeColor");
  if (current && LEGACY_COLOR_MAP[current]) {
    ConfigService.setReaderConfig("themeColor", LEGACY_COLOR_MAP[current]);
  }
}
