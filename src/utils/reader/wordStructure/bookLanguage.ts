/**
 * Book-language detection for word-structure plugin routing.
 *
 * The Book model has no language field and EPUB metadata isn't exposed to the
 * renderer, so the reader detects the language once from the first rendered
 * page (script counts + Latin-language stopword vote) and caches it per book
 * key in ConfigService. The popup then routes Latin-script clicks to the
 * right language pack (a Cyrillic click is always "ru" for now).
 */

import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";

const CONFIG_KEY = "wsBookLanguage";
const SAMPLE_CHARS = 4000;

/** small stopword profiles for Latin-script languages we may have packs for */
const LATIN_STOPWORDS: Record<string, string[]> = {
  en: ["the", "and", "of", "to", "in", "is", "that", "was", "with"],
  de: ["der", "die", "und", "das", "nicht", "ein", "mit", "ist", "auf"],
  fr: ["le", "la", "les", "et", "des", "que", "une", "dans", "est"],
  es: ["el", "los", "las", "que", "una", "por", "con", "para", "está"],
  it: ["il", "che", "della", "per", "con", "una", "sono", "nel", "gli"],
  pt: ["o", "que", "não", "uma", "com", "para", "mais", "dos", "como"],
};

export function detectLanguageFromText(text: string): string {
  const sample = text.slice(0, SAMPLE_CHARS);
  let cyrillic = 0;
  let latin = 0;
  for (const char of sample) {
    if (/[Ѐ-ӿ]/.test(char)) cyrillic += 1;
    else if (/[A-Za-zÀ-ÿ]/.test(char)) latin += 1;
  }
  if (cyrillic === 0 && latin === 0) return "";
  if (cyrillic > latin) return "ru";

  const words = sample
    .toLowerCase()
    .split(/[^a-zà-ÿ']+/)
    .filter(Boolean);
  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) || 0) + 1);
  let best = "en";
  let bestScore = 0;
  for (const [lang, stopwords] of Object.entries(LATIN_STOPWORDS)) {
    let score = 0;
    for (const stopword of stopwords) score += counts.get(stopword) || 0;
    if (score > bestScore) {
      bestScore = score;
      best = lang;
    }
  }
  return best;
}

export function getCachedBookLanguage(bookKey: string): string {
  if (!bookKey) return "";
  const entry = ConfigService.getObjectConfig(bookKey, CONFIG_KEY, {});
  return (entry && entry.lang) || "";
}

/**
 * Detect and cache the book's language from a rendered document. Cheap and
 * idempotent — returns the cached value when present.
 */
export function detectAndCacheBookLanguage(
  bookKey: string,
  doc: Document | null | undefined
): string {
  const cached = getCachedBookLanguage(bookKey);
  if (cached) return cached;
  const text = doc?.body?.textContent || "";
  const lang = detectLanguageFromText(text);
  if (bookKey && lang) {
    ConfigService.setObjectConfig(bookKey, { lang }, CONFIG_KEY);
  }
  return lang;
}
