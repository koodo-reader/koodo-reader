/**
 * Build the word-structure data pack consumed by
 * src/utils/reader/wordStructure/nestPack.ts.
 *
 * Input: MorphyNet Russian TSVs (https://github.com/kbatsuren/MorphyNet,
 * CC BY-SA 3.0, source: Russian Wiktionary):
 *   rus.derivational.v1.tsv  — source_lemma \t target_lemma \t srcPOS \t tgtPOS \t affix \t type
 *   rus.inflectional.v1.tsv  — lemma \t form \t features \t segments
 *
 * Output (to public/assets/word-structure/):
 *   ru.nests.v1.tsv — word \t root \t parent \t affix \t type \t pos
 *                     one row per lemma that belongs to a word-formation nest
 *                     with >= 2 members; parent/affix empty for nest roots.
 *   ru.forms.v1.tsv — form \t lemma
 *                     inflected forms (lookup keys lowercased, ё→е) for lemmas
 *                     present in ru.nests.v1.tsv; identity rows are omitted.
 *
 * The nest structure is a parent forest: every derived lemma keeps its FIRST
 * source lemma as parent, so nests form a strict partition (unlike connected
 * components, which over-merge, or 2-hop neighborhoods, which are not a
 * partition at all). Parent cycles in the source data are broken by treating
 * the cycle entry point as a root.
 *
 * Optionally joins short glosses from the OpenRussian dataset
 * (https://github.com/Badestrand/russian-dictionary, CC BY-SA 4.0) into
 * ru.glosses.v1.tsv — word \t english \t german.
 *
 * Usage:
 *   node scripts/buildWordStructurePack.mjs --lang ru <derivational.tsv> <inflectional.tsv> [openrussian-csv-dir]
 *   node scripts/buildWordStructurePack.mjs --lang en <derivational.tsv> <inflectional.tsv>
 *
 * Besides the pack TSVs this also emits <lang>-word-structure.plugin.json —
 * a ready-to-paste "word-structure" plugin manifest with per-file SHA-256.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
function takeOption(name) {
  const index = argv.indexOf(name);
  if (index < 0) return null;
  const value = argv[index + 1];
  argv.splice(index, 2);
  return value;
}
const lang = takeOption("--lang") || "ru";
// optional flat source→derived edge list (DerivBase.Ru) used to adopt words
// that MorphyNet leaves as orphan roots (бег, рассказ, ученик…)
const adoptPath = takeOption("--adopt-edges");
// optional word → seg:role|seg:role dictionary (ru.wiktionary морфо-ru)
const morphoPath = takeOption("--morpho");
const [derivPath, inflPath, glossDir] = argv;
if (!derivPath || !inflPath || !["ru", "en"].includes(lang)) {
  console.error(
    "usage: node scripts/buildWordStructurePack.mjs --lang <ru|en> [--adopt-edges edges.tsv] [--morpho morfo.tsv] <derivational.tsv> <inflectional.tsv> [openrussian-csv-dir]"
  );
  process.exit(1);
}

const outDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "assets",
  "word-structure"
);
mkdirSync(outDir, { recursive: true });

// key normalization must match src/utils/reader/wordStructure/languageProfiles.ts
// ru: lowercase, strip Wiktionary stress marks (combining acute/grave), fold ё→е.
//     NB: don't NFD-strip all combining marks — that would corrupt й (и + breve).
const NORMALIZERS = {
  ru: (s) => s.toLowerCase().replace(/[̀́]/g, "").replace(/ё/g, "е"),
  en: (s) => s.toLowerCase().replace(/’/g, "'"),
};
const CLEAN_KEYS = {
  ru: (s) => /^[а-я][а-я-]*$/.test(s),
  en: (s) => /^[a-z][a-z'-]*$/.test(s),
};
const normalizeKey = NORMALIZERS[lang];
const isCleanKey = CLEAN_KEYS[lang];

// ---- 1. derivational parent forest -----------------------------------------
const parentEdge = new Map(); // target -> { parent, affix, type, pos } (first edge wins)
const words = new Set();
for (const line of readFileSync(derivPath, "utf-8").split(/\r?\n/)) {
  if (!line) continue;
  const p = line.split("\t");
  if (p.length < 6) continue;
  const [source, target, , targetPos, affix, type] = p.map((x) => x.trim());
  if (!source || !target || source === target) continue;
  words.add(source);
  words.add(target);
  if (!parentEdge.has(target)) {
    parentEdge.set(target, { parent: source, affix, type, pos: targetPos });
  }
}

// ---- 1b. orphan adoption via external edge list (DerivBase.Ru) --------------
// MorphyNet does not model zero-suffix deverbal derivation, so words like
// бег/рассказ/ученик sit as isolated nest roots. When --adopt-edges is given,
// orphans whose adoptive parent exists in the vocabulary get connected, with
// the affix reverse-derived from the surface strings.
let adopted = 0;
if (adoptPath) {
  const adoptParents = new Map(); // target -> [sources]
  for (const line of readFileSync(adoptPath, "utf-8").split(/\r?\n/)) {
    if (!line || line[0] === "#") continue;
    const tab = line.indexOf("\t");
    if (tab <= 0) continue;
    const source = line.slice(0, tab).trim();
    const target = line.slice(tab + 1).trim();
    if (!source || !target || source === target) continue;
    if (!adoptParents.has(target)) adoptParents.set(target, []);
    adoptParents.get(target).push(source);
  }
  const stripLite = (w) => {
    for (const e of ["ться", "ть", "ти", "чь", "ый", "ий", "ой", "а", "я", "о", "е", "ь"]) {
      if (w.endsWith(e) && w.length - e.length >= 3) return w.slice(0, -e.length);
    }
    return w;
  };
  const commonPrefixLen = (a, b) => {
    let i = 0;
    while (i < Math.min(a.length, b.length) && a[i] === b[i]) i += 1;
    return i;
  };
  const wouldCycle = (orphan, parent) => {
    let cur = parent;
    const seen = new Set();
    while (parentEdge.has(cur) && !seen.has(cur)) {
      if (cur === orphan) return true;
      seen.add(cur);
      cur = parentEdge.get(cur).parent;
    }
    return cur === orphan;
  };
  // match adoptive parents through normalized keys so ё/е spelling
  // differences between the resources don't block adoption
  const wordByKey = new Map();
  for (const w of words) {
    const k = normalizeKey(w);
    if (!wordByKey.has(k)) wordByKey.set(k, w);
  }
  const adoptByKey = new Map();
  for (const [target, sources] of adoptParents) {
    const k = normalizeKey(target);
    if (!adoptByKey.has(k)) adoptByKey.set(k, sources);
  }
  // words known only to the edge list (e.g. побег) join the vocabulary when
  // the inflectional data attests them as real lemmas
  const attestedLemmas = new Set();
  for (const line of readFileSync(inflPath, "utf-8").split(/\r?\n/)) {
    const tab = line.indexOf("\t");
    if (tab > 0) attestedLemmas.add(normalizeKey(line.slice(0, tab)));
  }
  for (const [targetKey, sources] of adoptByKey) {
    if (wordByKey.has(targetKey)) continue;
    if (!attestedLemmas.has(targetKey)) continue;
    if (!sources.some((s) => wordByKey.has(normalizeKey(s)))) continue;
    const target = sources
      .map(() => targetKey)[0]; // DerivBase spelling is already lowercased
    words.add(target);
    wordByKey.set(targetKey, target);
  }
  for (const word of words) {
    if (parentEdge.has(word)) continue;
    const candidates = adoptByKey.get(normalizeKey(word));
    if (!candidates) continue;
    const parent = candidates
      .map((p) => wordByKey.get(normalizeKey(p)))
      .find((p) => p && p !== word && !wouldCycle(word, p));
    if (!parent) continue;
    // reverse-derive the affix from the surface strings; align on normalized
    // spellings so ё/е differences (учёный vs ученик) don't break it
    let affix = "";
    let type = "suffix";
    const wordN = normalizeKey(word);
    const parentN = normalizeKey(parent);
    const parentStemN = stripLite(parentN);
    if (wordN.endsWith(parentN) && wordN.length > parentN.length) {
      affix = wordN.slice(0, wordN.length - parentN.length);
      type = "prefix";
    } else if (wordN.endsWith(parentStemN) && wordN.length > parentStemN.length) {
      affix = wordN.slice(0, wordN.length - parentStemN.length);
      type = "prefix";
    } else {
      const shared = commonPrefixLen(wordN, parentStemN);
      if (shared >= 3) {
        affix = wordN.slice(shared); // may be "" = zero suffix (бег ← бегать)
        type = "suffix";
      } else {
        continue; // surface forms don't align; skip rather than guess
      }
    }
    parentEdge.set(word, { parent, affix, type, pos: "U" });
    adopted += 1;
  }
}

// root of each word, cycle-safe: a chain that revisits a word roots at the
// revisited word instead of looping forever
const rootOf = new Map();
function findRoot(word) {
  const chain = [];
  const seen = new Set();
  let current = word;
  while (parentEdge.has(current) && !seen.has(current)) {
    if (rootOf.has(current)) {
      const root = rootOf.get(current);
      for (const w of chain) rootOf.set(w, root);
      return root;
    }
    seen.add(current);
    chain.push(current);
    current = parentEdge.get(current).parent;
  }
  chain.push(current);
  const root = rootOf.get(current) ?? current;
  for (const w of chain) rootOf.set(w, root);
  return root;
}
for (const w of words) findRoot(w);

const nestSize = new Map();
for (const w of words) {
  const r = rootOf.get(w);
  nestSize.set(r, (nestSize.get(r) || 0) + 1);
}

const nestLines = [];
const nestWords = new Set();
for (const w of words) {
  const root = rootOf.get(w);
  if ((nestSize.get(root) || 0) < 2) continue;
  nestWords.add(w);
  const edge = parentEdge.get(w);
  nestLines.push(
    edge
      ? `${w}\t${root}\t${edge.parent}\t${edge.affix}\t${edge.type}\t${edge.pos}`
      : `${w}\t${root}\t\t\t\t`
  );
}
nestLines.sort();

// ---- 2. form -> lemma table -------------------------------------------------
const formLines = [];
const seenForms = new Set();
// nest membership is keyed the same way runtime lookups are
const nestKeys = new Set([...nestWords].map(normalizeKey));
const lemmaByKey = new Map();
for (const w of nestWords) {
  const k = normalizeKey(w);
  if (!lemmaByKey.has(k)) lemmaByKey.set(k, w);
}
for (const line of readFileSync(inflPath, "utf-8").split(/\r?\n/)) {
  if (!line) continue;
  const p = line.split("\t");
  if (p.length < 4) continue;
  const [lemma, form] = p;
  if (!lemma || !form) continue;
  const lemmaKey = normalizeKey(lemma);
  if (!nestKeys.has(lemmaKey)) continue;
  // comparatives are stored as "(по)нове́е" — the parenthesized prefix is
  // optional, so index the bare variant
  const formKey = normalizeKey(form.replace(/^\([^)]+\)/, ""));
  if (!isCleanKey(formKey)) continue; // remaining Wiktionary artifacts
  if (formKey === lemmaKey) continue; // identity rows resolved at runtime
  if (seenForms.has(formKey)) continue; // first record wins
  seenForms.add(formKey);
  formLines.push(`${formKey}\t${lemmaByKey.get(lemmaKey)}`);
}
formLines.sort();

// ---- 3. glosses (optional) --------------------------------------------------
const glossLines = [];
if (glossDir) {
  const shorten = (s) => {
    const head = s.split(";")[0].trim();
    return head.length > 60 ? head.slice(0, 57) + "…" : head;
  };
  const glossOf = new Map(); // normalized word -> [en, de]
  // verbs first: derivation-nest roots are predominantly verbs, so for
  // cross-POS homographs (знать the verb vs знать the nobility) the verb
  // gloss should lead; other POS glosses are appended after " / "
  for (const file of [
    "openrussian-verbs.csv",
    "openrussian-nouns.csv",
    "openrussian-adjectives.csv",
    "openrussian-others.csv",
  ]) {
    let text;
    try {
      text = readFileSync(join(glossDir, file), "utf-8");
    } catch {
      console.warn(`gloss source missing, skipping: ${file}`);
      continue;
    }
    const rows = text.split(/\r?\n/);
    const header = rows[0].split("\t");
    const bareCol = header.indexOf("bare");
    const enCol = header.indexOf("translations_en");
    const deCol = header.indexOf("translations_de");
    if (bareCol < 0 || enCol < 0) continue;
    for (let i = 1; i < rows.length; i += 1) {
      const cols = rows[i].split("\t");
      const bare = (cols[bareCol] || "").trim().toLowerCase();
      if (!bare) continue;
      const key = normalizeKey(bare);
      const en = shorten(cols[enCol] || "");
      const de = shorten(deCol >= 0 ? cols[deCol] || "" : "");
      if (!en && !de) continue;
      const existing = glossOf.get(key);
      if (!existing) {
        glossOf.set(key, [en, de]);
      } else {
        // cross-POS homograph: append the other sense once
        if (en && existing[0] && !existing[0].includes(en.slice(0, 12))) {
          existing[0] = shorten(`${existing[0]} / ${en}`);
        }
        if (de && existing[1] && !existing[1].includes(de.slice(0, 12))) {
          existing[1] = shorten(`${existing[1]} / ${de}`);
        }
      }
    }
  }
  for (const w of nestWords) {
    const gloss = glossOf.get(normalizeKey(w));
    if (gloss) glossLines.push(`${w}\t${gloss[0]}\t${gloss[1]}`);
  }
  glossLines.sort();
}

// ---- 4. write ---------------------------------------------------------------
const HEADER_SOURCE = {
  ru: "MorphyNet rus v1, CC BY-SA 3.0, source: Russian Wiktionary",
  en: "MorphyNet eng v1, CC BY-SA 3.0, source: English Wiktionary",
};
const header = (kind) =>
  `# koodo word-structure pack v1 (${kind}) | ${HEADER_SOURCE[lang] || "MorphyNet"} | https://github.com/kbatsuren/MorphyNet\n`;
// ---- 3b. morpheme dictionary layer (ru.wiktionary морфо-ru) -----------------
const morphoLines = [];
if (morphoPath) {
  const nestKeySet = new Set([...nestWords].map(normalizeKey));
  const seenMorpho = new Set();
  for (const line of readFileSync(morphoPath, "utf-8").split(/\r?\n/)) {
    if (!line || line[0] === "#") continue;
    const tab = line.indexOf("\t");
    if (tab <= 0) continue;
    const word = line.slice(0, tab);
    const key = normalizeKey(word);
    if (!nestKeySet.has(key) || seenMorpho.has(key)) continue;
    // single-segment entries carry no analysis ("учитель:root") — the
    // synthesized breakdown is more informative, so skip them
    if (!line.slice(tab + 1).includes("|")) continue;
    seenMorpho.add(key);
    morphoLines.push(line);
  }
  morphoLines.sort();
}

const files = { nests: `${lang}.nests.v1.tsv`, forms: `${lang}.forms.v1.tsv` };
const contents = {
  nests: header("nests") + nestLines.join("\n") + "\n",
  forms: header("forms") + formLines.join("\n") + "\n",
};
if (morphoLines.length > 0) {
  files.morphemes = `${lang}.morphemes.v1.tsv`;
  contents.morphemes =
    "# koodo word-structure pack v1 (morphemes) | ru.wiktionary морфо-ru templates, CC BY-SA 4.0\n" +
    morphoLines.join("\n") +
    "\n";
}
if (glossLines.length > 0) {
  files.glosses = `${lang}.glosses.v1.tsv`;
  contents.glosses =
    "# koodo word-structure pack v1 (glosses) | OpenRussian (github.com/Badestrand/russian-dictionary), CC BY-SA 4.0\n" +
    glossLines.join("\n") +
    "\n";
}
const sha256 = {};
let totalBytes = 0;
for (const [key, name] of Object.entries(files)) {
  writeFileSync(join(outDir, name), contents[key]);
  sha256[key] = createHash("sha256").update(contents[key]).digest("hex");
  totalBytes += Buffer.byteLength(contents[key]);
}

// ---- 5. plugin manifest ------------------------------------------------------
const DISPLAY = { ru: "Russian", en: "English" };
const manifest = {
  identifier: `${lang}-word-structure`,
  type: "word-structure",
  displayName: `Word structure (${DISPLAY[lang]})`,
  icon: "convert-text",
  version: "1.0.0",
  autoValue: "",
  langList: [],
  voiceList: [],
  config: {
    lang,
    packVersion: "1.0.0",
    packBaseUrl: "assets/word-structure",
    files,
    sha256,
    sizeMB: Math.round(totalBytes / 1024 / 1024),
    glossLangs: files.glosses ? ["en", "de"] : [],
  },
  script: "",
  scriptSHA256: createHash("sha256").update("").digest("hex"),
};
writeFileSync(
  join(outDir, `${lang}-word-structure.plugin.json`),
  JSON.stringify(manifest, null, 2) + "\n"
);

console.log(
  `nests: ${nestLines.length} words in ${[...nestSize.values()].filter((s) => s >= 2).length} nests (>=2 members)`
);
console.log(`forms: ${formLines.length} inflected-form rows`);
console.log(`glosses: ${glossLines.length} rows`);
console.log(`adopted orphans: ${adopted}`);
console.log(`morpheme dictionary rows: ${morphoLines.length}`);
console.log(`wrote pack files + ${lang}-word-structure.plugin.json to ${outDir}`);
