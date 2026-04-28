import { ConfigService } from "../assets/lib/kookit-extra-browser.min";

export const POPUP_OPTION_LIMIT = 8;
export const POPUP_OPTION_ORDER_CONFIG = "popupOptionOrder";
export const POPUP_OPTION_ENABLED_CONFIG = "popupOptionEnabled";

export type PopupOptionKey =
  | "note"
  | "highlight"
  | "translation"
  | "copy"
  | "search-book"
  | "dict"
  | "browser"
  | "speaker"
  | "speech-start"
  | "assistant";

export interface PopupOptionItem {
  key: PopupOptionKey;
  name: string;
  title: string;
  icon: string;
  defaultEnabled: boolean;
}

export const popupList: PopupOptionItem[] = [
  {
    key: "note",
    name: "note",
    title: "Take a note",
    icon: "note",
    defaultEnabled: true,
  },
  {
    key: "highlight",
    name: "highlight",
    title: "Highlight",
    icon: "highlight",
    defaultEnabled: true,
  },
  {
    key: "translation",
    name: "translation",
    title: "Translate",
    icon: "translation",
    defaultEnabled: true,
  },
  {
    key: "copy",
    name: "copy",
    title: "Copy",
    icon: "copy",
    defaultEnabled: true,
  },
  {
    key: "search-book",
    name: "search-book",
    title: "Search in the Book",
    icon: "search-book",
    defaultEnabled: true,
  },
  {
    key: "dict",
    name: "dict",
    title: "Dictionary",
    icon: "dict",
    defaultEnabled: true,
  },
  {
    key: "browser",
    name: "browser",
    title: "Search on the Internet",
    icon: "browser",
    defaultEnabled: true,
  },
  {
    key: "speaker",
    name: "speaker",
    title: "Speak the text",
    icon: "speaker",
    defaultEnabled: true,
  },
  {
    key: "speech-start",
    name: "speech-start",
    title: "Read from here",
    icon: "earphone",
    defaultEnabled: false,
  },
  {
    key: "assistant",
    name: "assistant",
    title: "Ask AI",
    icon: "ai-assist",
    defaultEnabled: false,
  },
];

const popupOptionKeySet = new Set(popupList.map((item) => item.key));

export const popupOptionMap = popupList.reduce(
  (result, item) => ({ ...result, [item.key]: item }),
  {} as Record<PopupOptionKey, PopupOptionItem>
);

export const getDefaultEnabledPopupOptionKeys = () => {
  return popupList
    .filter((item) => item.defaultEnabled)
    .map((item) => item.key);
};

export const getPopupOptionOrder = () => {
  const savedOrder = ConfigService.getAllListConfig(POPUP_OPTION_ORDER_CONFIG);
  const normalizedSavedOrder = Array.isArray(savedOrder)
    ? savedOrder.filter((item) => popupOptionKeySet.has(item as PopupOptionKey))
    : [];

  return Array.from(
    new Set([...normalizedSavedOrder, ...popupList.map((item) => item.key)])
  ) as PopupOptionKey[];
};

export const getEnabledPopupOptionKeys = () => {
  const savedEnabled = ConfigService.getAllListConfig(
    POPUP_OPTION_ENABLED_CONFIG
  );
  console.log(savedEnabled, "savedEnabled43534");
  const normalizedSavedEnabled =
    savedEnabled && savedEnabled.length > 0
      ? savedEnabled.filter((item) =>
          popupOptionKeySet.has(item as PopupOptionKey)
        )
      : getDefaultEnabledPopupOptionKeys();
  console.log(normalizedSavedEnabled, "normalizedSavedEnabled");
  console.log(getPopupOptionOrder(), "getPopupOptionOrder()");

  return getPopupOptionOrder()
    .filter((item) => normalizedSavedEnabled.includes(item))
    .slice(0, POPUP_OPTION_LIMIT);
};

export const getPopupOptionSettingList = () => {
  const enabledPopupOptionKeys = getEnabledPopupOptionKeys();

  return getPopupOptionOrder().map((key) => ({
    id: key,
    ...popupOptionMap[key],
    enabled: enabledPopupOptionKeys.includes(key),
  }));
};

export const savePopupOptionSettingList = (
  optionList: Array<{ key: PopupOptionKey; enabled: boolean }>
) => {
  console.log(optionList, "savePopupOptionSettingList");
  const order = optionList.map((item) => item.key);
  const enabled = order
    .filter((key) => optionList.find((item) => item.key === key)?.enabled)
    .slice(0, POPUP_OPTION_LIMIT);

  ConfigService.setAllListConfig(order, POPUP_OPTION_ORDER_CONFIG);
  ConfigService.setAllListConfig(enabled, POPUP_OPTION_ENABLED_CONFIG);
};
