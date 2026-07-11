/**
 * Multi-language pack engine for the word-structure feature.
 *
 * Packs are declared by "word-structure" plugins (pure JSON manifests, see
 * wordStructurePlugin.ts). For each language the engine downloads the pack
 * files from the plugin's packBaseUrl, verifies their SHA-256 when the
 * manifest provides hashes, parses them into in-memory maps (yielding to the
 * event loop between chunks), and answers synchronous lookups:
 *
 *   inflected form -> lemma -> derivation chain -> word-formation nest
 *   plus optional glosses and dictionary morpheme segmentations.
 */

import { getLanguageProfile } from "./languageProfiles";
import { WordStructurePluginConfig } from "./wordStructurePlugin";
import type { Morpheme, MorphemeRole } from "./morphemeParse";

const MORPHEME_ROLES: ReadonlySet<string> = new Set([
  "prefix",
  "root",
  "suffix",
  "ending",
  "interfix",
  "postfix",
]);

export interface NestRow {
  word: string;
  root: string;
  parent: string;
  affix: string;
  type: string;
  pos: string;
}

export interface NestNode {
  word: string;
  affix: string;
  type: string;
  pos: string;
  children: NestNode[];
}

export interface WordStructureResult {
  lang: string;
  /** lemma resolved from the clicked word, in dictionary spelling */
  lemma: string;
  /** nest root (ultimate underived ancestor) */
  root: string;
  /** derivation chain from root down to the lemma (root first) */
  chain: NestRow[];
  /** full nest tree rooted at `root` */
  tree: NestNode;
  /** number of words in the nest */
  memberCount: number;
}

export type NestPackProgress = {
  lang: string;
  phase: "idle" | "downloading" | "parsing" | "ready" | "error";
  message?: string;
};

const PARSE_CHUNK_LINES = 60000;

interface PackInstance {
  lang: string;
  config: WordStructurePluginConfig;
  formToLemma: Map<string, string>;
  rowByKey: Map<string, NestRow>;
  membersByRoot: Map<string, NestRow[]>;
  glossByKey: Map<string, string[]>;
  morphemesByKey: Map<string, Morpheme[]>;
  ready: boolean;
  loadPromise: Promise<void> | null;
}

const packs = new Map<string, PackInstance>();
const progressListeners = new Set<(p: NestPackProgress) => void>();

function emit(progress: NestPackProgress) {
  for (const listener of progressListeners) {
    try {
      listener(progress);
    } catch {
      /* listener errors must not break loading */
    }
  }
}

export function addNestPackListener(listener: (p: NestPackProgress) => void) {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

export function isNestPackReady(lang: string) {
  return packs.get(lang)?.ready === true;
}

function packUrl(config: WordStructurePluginConfig, file: string) {
  const base = /^https?:\/\//.test(config.packBaseUrl)
    ? config.packBaseUrl
    : `${process.env.PUBLIC_URL || ""}/${config.packBaseUrl.replace(/^\//, "")}`;
  return `${base.replace(/\/$/, "")}/${file}`;
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchPackText(
  config: WordStructurePluginConfig,
  fileKey: keyof WordStructurePluginConfig["files"]
): Promise<string> {
  const file = config.files[fileKey];
  if (!file) return "";
  const response = await fetch(packUrl(config, file), { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`word-structure pack ${file}: HTTP ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const expected = config.sha256?.[fileKey];
  if (expected) {
    const actual = await sha256Hex(buffer);
    if (actual !== expected.toLowerCase()) {
      throw new Error(`word-structure pack ${file}: checksum mismatch`);
    }
  }
  return new TextDecoder("utf-8").decode(buffer);
}

function yieldToEventLoop() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function parseLines(
  text: string,
  handleLine: (line: string) => void
): Promise<void> {
  if (!text) return;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line && line.charCodeAt(0) !== 35 /* # header/comment */) {
      handleLine(line);
    }
    if (i > 0 && i % PARSE_CHUNK_LINES === 0) await yieldToEventLoop();
  }
}

function getOrCreatePack(config: WordStructurePluginConfig): PackInstance {
  let pack = packs.get(config.lang);
  if (!pack) {
    pack = {
      lang: config.lang,
      config,
      formToLemma: new Map(),
      rowByKey: new Map(),
      membersByRoot: new Map(),
      glossByKey: new Map(),
      morphemesByKey: new Map(),
      ready: false,
      loadPromise: null,
    };
    packs.set(config.lang, pack);
  }
  return pack;
}

export function ensureNestPackLoaded(
  config: WordStructurePluginConfig
): Promise<void> {
  const pack = getOrCreatePack(config);
  if (pack.loadPromise) return pack.loadPromise;
  const profile = getLanguageProfile(config.lang, config);
  const normalize = profile.normalizeKey;
  pack.loadPromise = (async () => {
    try {
      // clear any partial state left by a previous failed attempt, so a retry
      // re-parses from scratch instead of appending duplicate nest members
      pack.formToLemma.clear();
      pack.rowByKey.clear();
      pack.membersByRoot.clear();
      pack.glossByKey.clear();
      pack.morphemesByKey.clear();
      pack.ready = false;
      emit({ lang: pack.lang, phase: "downloading" });
      const [nestsText, formsText, glossesText, morphemesText] =
        await Promise.all([
          fetchPackText(config, "nests"),
          fetchPackText(config, "forms"),
          config.files.glosses
            ? fetchPackText(config, "glosses").catch(() => "")
            : Promise.resolve(""),
          config.files.morphemes
            ? fetchPackText(config, "morphemes").catch(() => "")
            : Promise.resolve(""),
        ]);

      emit({ lang: pack.lang, phase: "parsing" });
      await parseLines(nestsText, (line) => {
        const p = line.split("\t");
        if (p.length < 6) return;
        const row: NestRow = {
          word: p[0],
          root: p[1],
          parent: p[2],
          affix: p[3],
          type: p[4],
          pos: p[5],
        };
        pack.rowByKey.set(normalize(row.word), row);
        let members = pack.membersByRoot.get(row.root);
        if (!members) {
          members = [];
          pack.membersByRoot.set(row.root, members);
        }
        members.push(row);
      });
      await parseLines(formsText, (line) => {
        const tab = line.indexOf("\t");
        if (tab <= 0) return;
        pack.formToLemma.set(line.slice(0, tab), line.slice(tab + 1));
      });
      await parseLines(glossesText, (line) => {
        const p = line.split("\t");
        if (p.length < 2) return;
        pack.glossByKey.set(normalize(p[0]), p.slice(1));
      });
      await parseLines(morphemesText, (line) => {
        const tab = line.indexOf("\t");
        if (tab <= 0) return;
        const segments: Morpheme[] = [];
        for (const part of line.slice(tab + 1).split("|")) {
          const colon = part.lastIndexOf(":");
          if (colon <= 0) return;
          const role = part.slice(colon + 1);
          if (!MORPHEME_ROLES.has(role)) return;
          segments.push({
            text: part.slice(0, colon),
            role: role as MorphemeRole,
          });
        }
        if (segments.length > 0) {
          pack.morphemesByKey.set(normalize(line.slice(0, tab)), segments);
        }
      });

      pack.ready = true;
      emit({ lang: pack.lang, phase: "ready" });
    } catch (error) {
      pack.loadPromise = null;
      emit({
        lang: pack.lang,
        phase: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  })();
  return pack.loadPromise;
}

function buildNestTree(
  root: string,
  members: NestRow[],
  lang: string
): NestNode {
  const nodeByWord = new Map<string, NestNode>();
  for (const row of members) {
    nodeByWord.set(row.word, {
      word: row.word,
      affix: row.affix,
      type: row.type,
      pos: row.pos,
      children: [],
    });
  }
  let rootNode = nodeByWord.get(root);
  if (!rootNode) {
    rootNode = { word: root, affix: "", type: "", pos: "", children: [] };
    nodeByWord.set(root, rootNode);
  }
  for (const row of members) {
    if (!row.parent || row.word === root) continue;
    const parentNode = nodeByWord.get(row.parent);
    const node = nodeByWord.get(row.word)!;
    if (parentNode && parentNode !== node) {
      parentNode.children.push(node);
    } else {
      rootNode.children.push(node);
    }
  }
  const sortChildren = (node: NestNode) => {
    node.children.sort((a, b) => a.word.localeCompare(b.word, lang));
    node.children.forEach(sortChildren);
  };
  sortChildren(rootNode);
  return rootNode;
}

/**
 * Look up the structure of a clicked word in the given language's pack.
 * Returns null when the word (or its lemma) is not part of any known nest.
 * Synchronous — call ensureNestPackLoaded() first.
 */
export function lookupWordStructure(
  raw: string,
  lang: string
): WordStructureResult | null {
  const pack = packs.get(lang);
  if (!pack || !pack.ready) return null;
  const profile = getLanguageProfile(lang, pack.config);
  const token = (raw.match(profile.tokenPattern) || [])[0];
  if (!token) return null;
  const key = profile.normalizeKey(token);

  const lemma = pack.formToLemma.get(key) ?? pack.rowByKey.get(key)?.word ?? null;
  if (!lemma) return null;
  const lemmaRow = pack.rowByKey.get(profile.normalizeKey(lemma));
  if (!lemmaRow) return null;

  const chain: NestRow[] = [];
  const seen = new Set<string>();
  let current: NestRow | undefined = lemmaRow;
  while (current && !seen.has(current.word)) {
    seen.add(current.word);
    chain.push(current);
    current = current.parent
      ? pack.rowByKey.get(profile.normalizeKey(current.parent))
      : undefined;
  }
  chain.reverse();

  const members = pack.membersByRoot.get(lemmaRow.root) || [lemmaRow];
  return {
    lang,
    lemma,
    root: lemmaRow.root,
    chain,
    tree: buildNestTree(lemmaRow.root, members, lang),
    memberCount: members.length,
  };
}

/** short dictionary gloss for a nest word; glossLang indexes the plugin's
 * glossLangs list (falls back to the first available column) */
export function getGloss(
  word: string,
  lang: string,
  glossLang?: string
): string | null {
  const pack = packs.get(lang);
  if (!pack) return null;
  const profile = getLanguageProfile(lang, pack.config);
  const gloss = pack.glossByKey.get(profile.normalizeKey(word));
  if (!gloss) return null;
  const glossLangs = pack.config.glossLangs || [];
  const index = glossLang ? glossLangs.indexOf(glossLang) : 0;
  return gloss[index >= 0 ? index : 0] || gloss[0] || null;
}

export function getGlossLangs(lang: string): string[] {
  return packs.get(lang)?.config.glossLangs || [];
}

/** dictionary-sourced morpheme breakdown (e.g. ru.wiktionary морфо-ru),
 * preferred over the synthesized one when present */
export function getDictionaryBreakdown(
  word: string,
  lang: string
): Morpheme[] | null {
  const pack = packs.get(lang);
  if (!pack) return null;
  const profile = getLanguageProfile(lang, pack.config);
  return pack.morphemesByKey.get(profile.normalizeKey(word)) || null;
}

/** test hook */
export function __resetNestPackForTesting() {
  packs.clear();
}
