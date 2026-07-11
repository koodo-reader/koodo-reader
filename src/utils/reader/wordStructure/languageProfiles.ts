/**
 * Core per-language defaults for the word-structure engine. A plugin's config
 * may override any of these; unknown languages fall back to GENERIC (plain
 * hyphen notation, no ending rules), so a data-only plugin for a new language
 * works without core changes.
 */

import { RU_BREAKDOWN } from "./morphemeParse";
import type { MorphemeRole } from "./morphemeParse";
import type {
  WordStructureBreakdownProfile,
  WordStructureNotation,
  WordStructurePluginConfig,
} from "./wordStructurePlugin";

export interface LanguageProfile {
  lang: string;
  /** extracts the first lookup-able token from a selection */
  tokenPattern: RegExp;
  normalizeKey(raw: string): string;
  breakdown: Required<WordStructureBreakdownProfile>;
  roleLabels: Record<MorphemeRole, string>;
  notation: WordStructureNotation;
}

const RU_PROFILE: LanguageProfile = {
  lang: "ru",
  tokenPattern: /[Ѐ-ӿ̀́ёЁ-]+/,
  normalizeKey: (raw) =>
    raw
      .toLowerCase()
      .replace(/[̀́]/g, "")
      .replace(/ё/g, "е"),
  breakdown: RU_BREAKDOWN,
  roleLabels: {
    prefix: "приставка",
    root: "корень",
    suffix: "суффикс",
    ending: "окончание",
    interfix: "интерфикс",
    postfix: "постфикс",
  },
  notation: "ru-school",
};

const EN_PROFILE: LanguageProfile = {
  lang: "en",
  tokenPattern: /[A-Za-z][A-Za-z'-]*/,
  normalizeKey: (raw) => raw.toLowerCase().replace(/’/g, "'"),
  breakdown: {
    verbEndings: [],
    adjEndings: [],
    nounVowelEndings: "",
    softFinal: "",
    alternations: { y: "i" },
    absorbDoubling: true,
    postfixes: [],
  },
  roleLabels: {
    prefix: "prefix",
    root: "root",
    suffix: "suffix",
    ending: "ending",
    interfix: "interfix",
    postfix: "postfix",
  },
  notation: "hyphen",
};

const GENERIC_PROFILE: LanguageProfile = {
  ...EN_PROFILE,
  lang: "",
  tokenPattern: /[\p{L}][\p{L}'-]*/u,
  breakdown: { ...EN_PROFILE.breakdown, alternations: {}, absorbDoubling: false },
};

const PROFILES: Record<string, LanguageProfile> = {
  ru: RU_PROFILE,
  en: EN_PROFILE,
};

export function getLanguageProfile(
  lang: string,
  pluginConfig?: WordStructurePluginConfig | null
): LanguageProfile {
  const base = PROFILES[lang] || { ...GENERIC_PROFILE, lang };
  if (!pluginConfig) return base;
  return {
    ...base,
    notation: pluginConfig.notation || base.notation,
    breakdown: { ...base.breakdown, ...(pluginConfig.profile || {}) },
    roleLabels: { ...base.roleLabels, ...(pluginConfig.roleLabels || {}) },
  };
}

/** crude script-based language guess for a clicked token (book-language
 * routing refines this later) */
export function guessTokenLanguage(raw: string): string {
  if (/[Ѐ-ӿ]/.test(raw)) return "ru";
  if (/[A-Za-z]/.test(raw)) return "en";
  return "";
}
