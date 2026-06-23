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
  | "openToc";

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
];

const KEY_LABELS: Record<number, string> = {
  8: "Backspace",
  9: "Tab",
  13: "Enter",
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
  45: "Insert",
  46: "Delete",
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
};

const MODIFIER_KEY_CODES = [16, 17, 18, 91, 92, 93, 224];

export const DEFAULT_SHORTCUT_CONFIG: ShortcutConfig = {
  nextPage: [
    { keyCode: 40 },
    { keyCode: 39 },
    { keyCode: 32 },
    { keyCode: 34 },
  ],
  prevPage: [{ keyCode: 38 }, { keyCode: 37 }, { keyCode: 33 }],
  bossKey: [{ keyCode: 9 }],
  toggleFishMode: [{ keyCode: 123 }],
  toggleFullscreen: [{ keyCode: 122 }],
  exitReader: [{ keyCode: 27 }],
  searchInBook: [{ keyCode: 70, ctrl: true }],
  openToc: [{ keyCode: 66, ctrl: true }],
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
  event: KeyboardEvent | { keyCode: number; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean },
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
  const keyLabel =
    KEY_LABELS[binding.keyCode] ||
    (binding.keyCode >= 65 && binding.keyCode <= 90
      ? String.fromCharCode(binding.keyCode)
      : `Key${binding.keyCode}`);
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
  event: KeyboardEvent | { keyCode: number; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean },
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
  event: KeyboardEvent | { keyCode: number; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean },
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
