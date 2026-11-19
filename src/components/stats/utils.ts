import { ReadingTimeUtil } from "../../assets/lib/kookit-extra-browser.min";

/** Localized label for a `YYYY-MM-DD` key, e.g. `May 1, 2025`. */
export const formatDayLabel = (dateKey: string, lang: string): string => {
  try {
    return new Intl.DateTimeFormat(ReadingTimeUtil.getDateLocale(lang), {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(ReadingTimeUtil.parseDateKey(dateKey));
  } catch (error) {
    return dateKey;
  }
};
