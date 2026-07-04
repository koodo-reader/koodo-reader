import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

export type ShortcutBinding = {
  keyCode: number;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
};

export type ShortcutAction =
  | "nextPage"
  | "prevPage"
  | "bossKey"
  | "toggleFishMode"
  | "toggleFullscreen"
  | "exitReader"
  | "searchInBook"
  | "openToc"
  | "openLeftPanel"
  | "openRightPanel"
  | "openTopPanel"
  | "openBottomPanel"
  | "createBookmark"
  | "openBookmarkList"
  | "openNoteList"
  | "prevChapter"
  | "nextChapter"
  | "openHighlightList"
  | "selectionTranslate"
  | "selectionDict"
  | "selectionNote"
  | "selectionHighlight"
  | "selectionSpeak"
  | "selectionSearch";

export type ShortcutConfig = Record<ShortcutAction, ShortcutBinding[]>;

export const SHORTCUT_ACTIONS: ShortcutAction[] = [
  "nextPage",
  "prevPage",
  "bossKey",
  "toggleFishMode",
  "toggleFullscreen",
  "exitReader",
  "searchInBook",
  "openToc",
  "openLeftPanel",
  "openRightPanel",
  "openTopPanel",
  "openBottomPanel",
  "createBookmark",
  "openBookmarkList",
  "openNoteList",
  "prevChapter",
  "nextChapter",
  "openHighlightList",
  "selectionTranslate",
  "selectionDict",
  "selectionNote",
  "selectionHighlight",
  "selectionSpeak",
  "selectionSearch",
];

const KEY_LABELS: Record<number, string> = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Ctrl",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Esc",
  32: "Space",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "←",
  38: "↑",
  39: "→",
  40: "↓",
  44: "PrintScreen",
  45: "Insert",
  46: "Delete",
  91: "Win",
  92: "Win",
  93: "Menu",
  106: "Num *",
  107: "Num +",
  109: "Num -",
  110: "Num .",
  111: "Num /",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  124: "F13",
  125: "F14",
  126: "F15",
  127: "F16",
  128: "F17",
  129: "F18",
  130: "F19",
  131: "F20",
  132: "F21",
  133: "F22",
  134: "F23",
  135: "F24",
  144: "NumLock",
  145: "ScrollLock",
  173: "-",
  174: "VolumeDown",
  175: "VolumeUp",
  176: "MediaNext",
  177: "MediaPrev",
  178: "MediaStop",
  179: "MediaPlay",
  181: "VolumeMute",
  182: "LaunchMail",
  183: "LaunchMedia",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  192: "`",
  219: "[",
  220: "\\",
  221: "]",
  222: "'",
  224: "Meta",
  225: "AltGraph",
};

const getKeyLabel = (keyCode: number): string => {
  if (KEY_LABELS[keyCode]) {
    return KEY_LABELS[keyCode];
  }
  if (keyCode >= 48 && keyCode <= 57) {
    return String.fromCharCode(keyCode);
  }
  if (keyCode >= 65 && keyCode <= 90) {
    return String.fromCharCode(keyCode);
  }
  if (keyCode >= 96 && keyCode <= 105) {
    return `Num ${keyCode - 96}`;
  }
  return `Key${keyCode}`;
};

/**
 * Key codes for modifier keys (Ctrl, Shift, Alt, Meta) that should not
 * themselves be treated as an assignable shortcut key.
 */
const MODIFIER_KEY_CODES = [16, 17, 18, 91, 92, 93, 224];

/**
 * Default keyboard shortcut bindings for the reader.
 * Users can override these via Settings > Shortcuts; overrides are
 * merged on top of these defaults in getShortcutConfig().
 */
export const DEFAULT_SHORTCUT_CONFIG: ShortcutConfig = {
  nextPage: [
    { keyCode: 40 }, // Down
    { keyCode: 39 }, // Right
    { keyCode: 32 }, // Space
    { keyCode: 34 }, // PageDown
  ],
  prevPage: [
    { keyCode: 38 }, // Up
    { keyCode: 37 }, // Left
    { keyCode: 33 }, // PageUp
  ],
  bossKey: [{ keyCode: 9 }], // Tab
  toggleFishMode: [{ keyCode: 123 }], // F12
  toggleFullscreen: [{ keyCode: 122 }], // F11
  exitReader: [{ keyCode: 27 }], // Esc
  searchInBook: [{ keyCode: 70, ctrl: true }], // Ctrl+F
  openLeftPanel: [{ keyCode: 117 }], // F6
  openRightPanel: [{ keyCode: 118 }], // F7
  openTopPanel: [{ keyCode: 119 }], // F8
  openBottomPanel: [{ keyCode: 120 }], // F9
  createBookmark: [{ keyCode: 66, ctrl: true, shift: true }], // Ctrl+Shift+B
  openBookmarkList: [{ keyCode: 66, ctrl: true, alt: true }], // Ctrl+Alt+B
  prevChapter: [{ keyCode: 37, ctrl: true, alt: true }], // Ctrl+Alt+Left
  nextChapter: [{ keyCode: 39, ctrl: true, alt: true }], // Ctrl+Alt+Right
  openNoteList: [{ keyCode: 78, ctrl: true, alt: true }], // Ctrl+Alt+N
  openHighlightList: [{ keyCode: 72, ctrl: true, alt: true }], // Ctrl+Alt+H
  openToc: [{ keyCode: 84, ctrl: true, alt: true }], // Ctrl+Alt+T
  selectionTranslate: [{ keyCode: 84, ctrl: true, shift: true }], // Ctrl+Shift+T
  selectionDict: [{ keyCode: 68, ctrl: true, shift: true }], // Ctrl+Shift+D
  selectionNote: [{ keyCode: 78, ctrl: true, shift: true }], // Ctrl+Shift+N
  selectionHighlight: [{ keyCode: 72, ctrl: true, shift: true }], // Ctrl+Shift+H
  selectionSpeak: [{ keyCode: 82, ctrl: true, shift: true }], // Ctrl+Shift+R
  selectionSearch: [{ keyCode: 70, ctrl: true, shift: true }], // Ctrl+Shift+F
};

const cloneBindings = (bindings: ShortcutBinding[]): ShortcutBinding[] =>
  bindings.map((b) => ({ ...b }));

const cloneConfig = (config: ShortcutConfig): ShortcutConfig => {
  const result = {} as ShortcutConfig;
  SHORTCUT_ACTIONS.forEach((action) => {
    result[action] = cloneBindings(config[action] || []);
  });
  return result;
};

export const bindingEquals = (
  a: ShortcutBinding,
  b: ShortcutBinding
): boolean =>
  a.keyCode === b.keyCode &&
  !!a.ctrl === !!b.ctrl &&
  !!a.alt === !!b.alt &&
  !!a.shift === !!b.shift;

export const matchShortcut = (
  event:
    | KeyboardEvent
    | {
        keyCode: number;
        ctrlKey?: boolean;
        altKey?: boolean;
        shiftKey?: boolean;
      },
  bindings: ShortcutBinding[]
): boolean => {
  return bindings.some(
    (binding) =>
      event.keyCode === binding.keyCode &&
      !!event.ctrlKey === !!binding.ctrl &&
      !!event.altKey === !!binding.alt &&
      !!event.shiftKey === !!binding.shift
  );
};

export const parseKeyEvent = (event: KeyboardEvent): ShortcutBinding | null => {
  if (MODIFIER_KEY_CODES.includes(event.keyCode)) {
    return null;
  }
  return {
    keyCode: event.keyCode,
    ctrl: event.ctrlKey || undefined,
    alt: event.altKey || undefined,
    shift: event.shiftKey || undefined,
  };
};

export const formatShortcut = (binding: ShortcutBinding): string => {
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.alt) parts.push("Alt");
  if (binding.shift) parts.push("Shift");
  const keyLabel = getKeyLabel(binding.keyCode);
  parts.push(keyLabel);
  return parts.join(" + ");
};

export const getShortcutConfig = (): ShortcutConfig => {
  const stored = ConfigService.getReaderConfig("shortcutConfig");
  if (!stored) {
    return cloneConfig(DEFAULT_SHORTCUT_CONFIG);
  }
  try {
    const parsed = JSON.parse(stored) as Partial<ShortcutConfig>;
    const merged = cloneConfig(DEFAULT_SHORTCUT_CONFIG);
    SHORTCUT_ACTIONS.forEach((action) => {
      if (Array.isArray(parsed[action]) && parsed[action]!.length > 0) {
        merged[action] = parsed[action]!.map((b) => ({ ...b }));
      }
    });
    return merged;
  } catch {
    return cloneConfig(DEFAULT_SHORTCUT_CONFIG);
  }
};

export const saveShortcutConfig = (config: ShortcutConfig) => {
  ConfigService.setReaderConfig("shortcutConfig", JSON.stringify(config));
};

export const resetShortcutConfig = (): ShortcutConfig => {
  const config = cloneConfig(DEFAULT_SHORTCUT_CONFIG);
  saveShortcutConfig(config);
  return config;
};

export const findShortcutConflict = (
  config: ShortcutConfig,
  action: ShortcutAction,
  binding: ShortcutBinding,
  excludeIndex?: number
): ShortcutAction | null => {
  for (const otherAction of SHORTCUT_ACTIONS) {
    const bindings = config[otherAction] || [];
    for (let i = 0; i < bindings.length; i++) {
      if (otherAction === action && excludeIndex === i) continue;
      if (bindingEquals(bindings[i], binding)) {
        return otherAction;
      }
    }
  }
  return null;
};

const isVerticalArrow = (keyCode: number) => keyCode === 38 || keyCode === 40;

export const isPrevPageKey = (
  event:
    | KeyboardEvent
    | {
        keyCode: number;
        ctrlKey?: boolean;
        altKey?: boolean;
        shiftKey?: boolean;
      },
  readerMode: string
): boolean => {
  const config = getShortcutConfig();
  if (!matchShortcut(event, config.prevPage)) {
    return false;
  }
  if (readerMode === "scroll" && isVerticalArrow(event.keyCode)) {
    return false;
  }
  return true;
};

export const isNextPageKey = (
  event:
    | KeyboardEvent
    | {
        keyCode: number;
        ctrlKey?: boolean;
        altKey?: boolean;
        shiftKey?: boolean;
      },
  readerMode: string
): boolean => {
  const config = getShortcutConfig();
  if (!matchShortcut(event, config.nextPage)) {
    return false;
  }
  if (readerMode === "scroll" && isVerticalArrow(event.keyCode)) {
    return false;
  }
  return true;
};
