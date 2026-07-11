/**
 * Synthesize a school-style morpheme breakdown (Russian разбор слова по
 * составу and its analogs in other languages) from a word's derivation chain.
 *
 * The chain (root → … → lemma, from nestPack) carries the affix added at each
 * step. Aligning those affixes onto the lemma's surface string — after
 * stripping the citation-form ending per the language profile — yields the
 * classic prefix / root / suffix / ending / postfix segmentation:
 *
 *   знать →(по-) познать →(рас-) распознать →(-вать) распознавать
 *   ⇒ рас|по|зна|ва|ть  (prefix, prefix, root, suffix, ending)
 *
 *   believe →(un-) unbelievable ⇒ un|believ|able (prefix, root, suffix)
 *
 * Data-driven, not a full morphological dictionary: when affixes cannot be
 * aligned onto the surface form we return null and the popup falls back to
 * the chain view. Language-specific rules (citation endings, alternations,
 * postfixes) come from the language profile / plugin config.
 */

import type { NestRow } from "./nestPack";
import type { WordStructureBreakdownProfile } from "./wordStructurePlugin";

export type MorphemeRole =
  | "prefix"
  | "root"
  | "suffix"
  | "ending"
  | "interfix"
  | "postfix";

export interface Morpheme {
  text: string;
  role: MorphemeRole;
}

export type BreakdownProfile = Required<WordStructureBreakdownProfile>;

/** Russian defaults; kept here so tests and callers without a plugin work */
export const RU_BREAKDOWN: BreakdownProfile = {
  verbEndings: ["ть", "ти", "чь"],
  adjEndings: ["ый", "ий", "ой"],
  nounVowelEndings: "аяое",
  softFinal: "ь",
  alternations: {
    г: "ж",
    к: "ч",
    х: "ш",
    д: "ж",
    т: "ч",
    з: "ж",
    с: "ш",
    ц: "ч",
  },
  absorbDoubling: false,
  postfixes: ["ся", "сь"],
};

/** strip the citation-form ending from a dictionary word (for the root stem) */
function stripCitationEnding(word: string, profile: BreakdownProfile): string {
  let stem = word;
  for (const postfix of profile.postfixes) {
    if (stem.endsWith(postfix)) {
      stem = stem.slice(0, -postfix.length);
      break;
    }
  }
  for (const ending of [...profile.verbEndings, ...profile.adjEndings]) {
    if (stem.endsWith(ending) && stem.length - ending.length >= 2) {
      return stem.slice(0, -ending.length);
    }
  }
  for (const ending of [
    ...profile.nounVowelEndings.split("").filter(Boolean),
    ...(profile.softFinal ? [profile.softFinal] : []),
  ]) {
    if (stem.endsWith(ending) && stem.length - ending.length >= 3) {
      return stem.slice(0, -ending.length);
    }
  }
  return stem;
}

/**
 * Locate the root stem inside the word, shortening it for alternations.
 * When the match succeeded only after dropping a final letter and the word
 * continues with its standard alternation partner (снег → снеж-, happy →
 * happi-), the alternated letter is absorbed into the root.
 */
function locateRoot(
  word: string,
  rootStem: string,
  profile: BreakdownProfile
): { start: number; length: number } | null {
  for (let length = rootStem.length; length >= 3; length -= 1) {
    const candidate = rootStem.slice(0, length);
    const start = word.indexOf(candidate);
    if (start < 0) continue;
    if (
      length < rootStem.length &&
      word[start + length] === profile.alternations[rootStem[length]]
    ) {
      return { start, length: length + 1 };
    }
    return { start, length };
  }
  return null;
}

/** prefixes surface in reverse application order */
function splitPrefixes(zone: string, prefixes: string[]): Morpheme[] {
  if (!zone) return [];
  const segments: Morpheme[] = [];
  let rest = zone;
  for (const prefix of [...prefixes].reverse()) {
    if (!rest) break;
    if (rest.startsWith(prefix)) {
      segments.push({ text: prefix, role: "prefix" });
      rest = rest.slice(prefix.length);
    }
  }
  if (rest) {
    segments.push({ text: rest, role: "prefix" });
  }
  return segments;
}

/**
 * Split the post-root zone with the chain's suffixes (applied left-to-right).
 * A raw affix may include letters that merged into the ending (вать → ва|ть)
 * or the root (ание → зна|ни|е), so an affix matches when the longest tail of
 * the remaining zone occurs inside it.
 */
function splitSuffixes(zone: string, suffixes: string[]): Morpheme[] | null {
  if (!zone) return [];
  const segments: Morpheme[] = [];
  let rest = zone;
  for (const affix of [...suffixes].reverse()) {
    if (!rest) break;
    let matched = "";
    if (rest.endsWith(affix)) {
      matched = affix;
    } else {
      for (let take = Math.min(affix.length, rest.length); take >= 1; take -= 1) {
        if (affix.includes(rest.slice(rest.length - take))) {
          matched = rest.slice(rest.length - take);
          break;
        }
      }
    }
    if (!matched) return null;
    segments.unshift({ text: matched, role: "suffix" });
    rest = rest.slice(0, rest.length - matched.length);
  }
  if (rest) {
    segments.unshift({ text: rest, role: "suffix" });
  }
  return segments;
}

function endingCandidates(
  pos: string,
  zone: string,
  profile: BreakdownProfile
): string[] {
  if (pos === "V" && profile.verbEndings.length > 0) {
    return profile.verbEndings.filter((e) => zone.endsWith(e));
  }
  if (pos === "J" && profile.adjEndings.length > 0) {
    return profile.adjEndings.filter((e) => zone.endsWith(e));
  }
  const verbMatch =
    pos === "" || pos === "U"
      ? profile.verbEndings.filter((e) => zone.endsWith(e))
      : [];
  const lastChar = zone.slice(-1);
  if (profile.nounVowelEndings.includes(lastChar) && lastChar) {
    return [...verbMatch, lastChar, ""];
  }
  if (profile.softFinal && lastChar === profile.softFinal) {
    return [...verbMatch, "", profile.softFinal];
  }
  return [...verbMatch, ""];
}

export function buildMorphemeBreakdown(
  chain: NestRow[],
  lemma: string,
  profile: BreakdownProfile = RU_BREAKDOWN
): Morpheme[] | null {
  if (chain.length === 0) return null;
  const pos = chain[chain.length - 1].pos || "";

  let working = lemma;
  let postfix: Morpheme | null = null;
  for (const candidate of profile.postfixes) {
    if (working.endsWith(candidate)) {
      postfix = { text: candidate, role: "postfix" };
      working = working.slice(0, -candidate.length);
      break;
    }
  }

  const rootStem = stripCitationEnding(chain[0].word, profile);
  const rootLocation = locateRoot(working, rootStem, profile);
  if (!rootLocation) return null;

  const prefixZone = working.slice(0, rootLocation.start);
  let rootText = working.slice(
    rootLocation.start,
    rootLocation.start + rootLocation.length
  );
  let tail = working.slice(rootLocation.start + rootLocation.length);

  // consonant doubling between root and suffix (run → run·n·er): absorb the
  // doubled letter into the root for display
  if (
    profile.absorbDoubling &&
    tail &&
    tail[0] === rootText.slice(-1) &&
    tail.length > 1
  ) {
    rootText += tail[0];
    tail = tail.slice(1);
  }

  const prefixAffixes = chain
    .filter((row) => row.type === "prefix" && row.affix)
    .map((row) => row.affix);
  const suffixAffixes = chain
    .filter((row) => row.type === "suffix" && row.affix)
    .map((row) => row.affix);

  const prefixes = splitPrefixes(prefixZone, prefixAffixes);

  for (const ending of endingCandidates(pos, tail, profile)) {
    const zone = ending ? tail.slice(0, tail.length - ending.length) : tail;
    const suffixes = splitSuffixes(zone, suffixAffixes);
    if (!suffixes) continue;
    const segments: Morpheme[] = [
      ...prefixes,
      { text: rootText, role: "root" },
      ...suffixes,
    ];
    if (ending) {
      segments.push({ text: ending, role: "ending" });
    } else if (
      profile.nounVowelEndings &&
      (pos === "N" || pos === "") &&
      /[бвгджзйклмнпрстфхцчшщ]$/.test(working)
    ) {
      // consonant-final noun in a language with vowel endings: draw the
      // explicit zero ending □ (Russian school notation)
      segments.push({ text: "", role: "ending" });
    }
    if (postfix) segments.push(postfix);
    return segments;
  }
  return null;
}
