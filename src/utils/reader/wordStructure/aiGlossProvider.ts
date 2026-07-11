/**
 * AI gloss provider for the word-structure popup.
 *
 * Design rule: the AI does LANGUAGE, never LINGUISTICS. The word family, the
 * derivation chains and the morpheme breakdown all come from the data packs;
 * this module only asks a user-configured OpenAI-compatible model to (1) state
 * the shared meaning of the root morpheme and (2) gloss the listed family
 * words — in the user's target language. Results are cached per
 * (lang, word, targetLang, modelId) in IndexedDB plus an in-memory layer, so
 * a family is paid for once and repeat popups are instant and offline.
 *
 * The model is resolved from koodo's existing custom-AI plugin records
 * (custom-ai-dict-plugin, falling back to custom-ai-trans-plugin); when none
 * is configured the provider reports unavailable and the popup silently
 * stays on pack glosses.
 */

import Plugin from "../../../models/Plugin";
import { chatStream } from "../../request/common";

export interface AiGlossModel {
  endpoint: string;
  providerId: string;
  apiKey: string;
  modelId: string;
}

export interface AiGlossResult {
  /** one-line sense of the root morpheme, or null when the model declined */
  root: string | null;
  /** word -> short gloss; null values mean the model was unsure */
  glosses: Record<string, string | null>;
}

export interface AiGlossRequest {
  lang: string;
  rootMorpheme: string;
  rootExamples: string[];
  words: string[];
  targetLang: string;
}

const MAX_WORDS_PER_REQUEST = 24;

const LANGUAGE_NAMES: Record<string, string> = {
  "zh-CN": "Simplified Chinese (简体中文)",
  "zh-TW": "Traditional Chinese (繁體中文)",
  zh: "Simplified Chinese (简体中文)",
  en: "English",
  de: "German",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  fr: "French",
  es: "Spanish",
};

const SOURCE_LANGUAGE_NAMES: Record<string, string> = {
  ru: "Russian",
  en: "English",
};

// ---- model resolution -------------------------------------------------------

export function resolveAiGlossModel(plugins: Plugin[]): AiGlossModel | null {
  for (const key of ["custom-ai-dict-plugin", "custom-ai-trans-plugin"]) {
    const plugin = plugins.find((item) => item.key === key);
    const config = plugin?.config as AiGlossModel | undefined;
    if (config?.endpoint && config?.apiKey && config?.modelId) {
      return {
        endpoint: config.endpoint,
        providerId: config.providerId || "",
        apiKey: config.apiKey,
        modelId: config.modelId,
      };
    }
  }
  return null;
}

// ---- cache ------------------------------------------------------------------

const memoryCache = new Map<string, string | null>();

const CACHE_DB = "KoodoWsGlossCache";
const CACHE_STORE = "glosses";
let cacheDbPromise: Promise<IDBDatabase | null> | null = null;

function openCacheDb(): Promise<IDBDatabase | null> {
  if (cacheDbPromise) return cacheDbPromise;
  cacheDbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(CACHE_DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return cacheDbPromise;
}

function cacheKey(
  lang: string,
  word: string,
  targetLang: string,
  modelId: string
) {
  return `${lang}|${targetLang}|${modelId}|${word}`;
}

async function cacheGet(key: string): Promise<string | null | undefined> {
  if (memoryCache.has(key)) return memoryCache.get(key);
  const db = await openCacheDb();
  if (!db) return undefined;
  return new Promise((resolve) => {
    try {
      const req = db
        .transaction(CACHE_STORE, "readonly")
        .objectStore(CACHE_STORE)
        .get(key);
      req.onsuccess = () => {
        if (req.result === undefined) resolve(undefined);
        else {
          memoryCache.set(key, req.result as string | null);
          resolve(req.result as string | null);
        }
      };
      req.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

async function cachePut(key: string, value: string | null): Promise<void> {
  memoryCache.set(key, value);
  const db = await openCacheDb();
  if (!db) return;
  try {
    db.transaction(CACHE_STORE, "readwrite")
      .objectStore(CACHE_STORE)
      .put(value, key);
  } catch {
    /* cache is best-effort */
  }
}

// ---- prompt & parsing -------------------------------------------------------

export function buildGlossPrompt(request: AiGlossRequest): string {
  const sourceName = SOURCE_LANGUAGE_NAMES[request.lang] || request.lang;
  const targetName =
    LANGUAGE_NAMES[request.targetLang] || request.targetLang;
  return [
    `You are a precise lexicographer. Below is CONFIRMED word-family data for ${sourceName}; do not modify or question its structure.`,
    `Root morpheme: "${request.rootMorpheme}" (as in: ${request.rootExamples.join(", ")})`,
    `Words: ${JSON.stringify(request.words)}`,
    `Tasks:`,
    `1. In ${targetName}, state the shared meaning of the root morpheme "${request.rootMorpheme}" in one short phrase (max 12 words).`,
    `2. In ${targetName}, give a short gloss (max 6 words) for EACH listed word.`,
    `Output STRICT JSON only, no markdown fences, exactly this shape:`,
    `{"root": "...", "glosses": {"word": "gloss", ...}}`,
    `Rules: never add, remove or re-segment words; use null for any word you are unsure about; glosses must be in ${targetName}.`,
  ].join("\n");
}

export function parseGlossResponse(
  raw: string,
  expectedWords: string[]
): AiGlossResult | null {
  const trimmed = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed: any;
  try {
    parsed = JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || typeof parsed.glosses !== "object") {
    return null;
  }
  const glosses: Record<string, string | null> = {};
  for (const word of expectedWords) {
    const value = parsed.glosses?.[word];
    glosses[word] = typeof value === "string" && value.trim() ? value.trim() : null;
  }
  return {
    root:
      typeof parsed.root === "string" && parsed.root.trim()
        ? parsed.root.trim()
        : null,
    glosses,
  };
}

// ---- main entry ---------------------------------------------------------------

const inFlight = new Map<string, Promise<AiGlossResult | null>>();

/**
 * Fetch AI glosses for a word family, cache-first. Returns null when the
 * request failed; individual glosses may be null when the model was unsure.
 */
export async function fetchAiGlosses(
  request: AiGlossRequest,
  model: AiGlossModel
): Promise<AiGlossResult | null> {
  const words = request.words.slice(0, MAX_WORDS_PER_REQUEST);
  const rootKey = cacheKey(
    request.lang,
    `root:${request.rootMorpheme}`,
    request.targetLang,
    model.modelId
  );

  // cache-first: resolve everything we already know
  const cachedRoot = await cacheGet(rootKey);
  const glosses: Record<string, string | null> = {};
  const missing: string[] = [];
  for (const word of words) {
    const cached = await cacheGet(
      cacheKey(request.lang, word, request.targetLang, model.modelId)
    );
    if (cached === undefined) missing.push(word);
    else glosses[word] = cached;
  }
  if (missing.length === 0 && cachedRoot !== undefined) {
    return { root: cachedRoot, glosses };
  }

  const flightKey = `${rootKey}|${missing.join(",")}`;
  if (inFlight.has(flightKey)) return inFlight.get(flightKey)!;
  const flight = (async (): Promise<AiGlossResult | null> => {
    let accumulated = "";
    try {
      await chatStream(
        model.endpoint,
        model.providerId,
        model.apiKey,
        model.modelId,
        buildGlossPrompt({ ...request, words: missing.length ? missing : words }),
        [],
        (result: any) => {
          if (result?.text) accumulated += result.text;
        }
      );
    } catch {
      return null;
    }
    const parsed = parseGlossResponse(
      accumulated,
      missing.length ? missing : words
    );
    if (!parsed) return null;
    for (const [word, gloss] of Object.entries(parsed.glosses)) {
      glosses[word] = gloss;
      await cachePut(
        cacheKey(request.lang, word, request.targetLang, model.modelId),
        gloss
      );
    }
    const root = cachedRoot !== undefined ? cachedRoot : parsed.root;
    if (cachedRoot === undefined) await cachePut(rootKey, parsed.root);
    return { root, glosses };
  })().finally(() => inFlight.delete(flightKey));
  inFlight.set(flightKey, flight);
  return flight;
}

/** test hook */
export function __resetAiGlossCacheForTesting() {
  memoryCache.clear();
  inFlight.clear();
  cacheDbPromise = null;
}
