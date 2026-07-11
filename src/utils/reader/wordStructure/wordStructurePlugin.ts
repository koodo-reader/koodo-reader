/**
 * The "word-structure" plugin type: a pure-JSON data manifest (no script,
 * zero eval surface). One plugin per language. The core engine (nestPack,
 * morphemeParse, popupStructure) reads everything it needs from the plugin's
 * config; the plugin itself only declares where the data pack lives, its
 * integrity hashes, and optional language-profile overrides.
 */

import Plugin from "../../../models/Plugin";
import type { MorphemeRole } from "./morphemeParse";

export const WORD_STRUCTURE_PLUGIN_TYPE = "word-structure";

export type WordStructureNotation = "ru-school" | "hyphen";

export interface WordStructureBreakdownProfile {
  /** citation-form endings stripped before affix alignment, by POS */
  verbEndings?: string[];
  adjEndings?: string[];
  /** vowels that act as noun endings when word-final (Russian аяое) */
  nounVowelEndings?: string;
  /** a final letter that usually belongs to the suffix, tried last (ь) */
  softFinal?: string;
  /** root-final consonant alternations (г→ж, y→i) */
  alternations?: Record<string, string>;
  /** absorb a doubled consonant between root and suffix into the root */
  absorbDoubling?: boolean;
  /** reflexive-style postfixes stripped before alignment (ся/сь) */
  postfixes?: string[];
}

export interface WordStructurePackFiles {
  nests: string;
  forms: string;
  glosses?: string;
  morphemes?: string;
}

export interface WordStructurePluginConfig {
  lang: string;
  packVersion: string;
  /** absolute URL, or path relative to PUBLIC_URL for bundled/dev packs */
  packBaseUrl: string;
  files: WordStructurePackFiles;
  /** hex SHA-256 per pack file; verified by the core downloader when set */
  sha256?: Partial<Record<keyof WordStructurePackFiles, string>>;
  sizeMB?: number;
  /** gloss languages available in the glosses file, in column order */
  glossLangs?: string[];
  notation?: WordStructureNotation;
  profile?: WordStructureBreakdownProfile;
  roleLabels?: Partial<Record<MorphemeRole, string>>;
}

export function getWordStructurePlugins(plugins: Plugin[]): Plugin[] {
  return plugins.filter((item) => item.type === WORD_STRUCTURE_PLUGIN_TYPE);
}

export function findWordStructurePlugin(
  plugins: Plugin[],
  lang: string
): Plugin | undefined {
  return getWordStructurePlugins(plugins).find(
    (item) => (item.config as WordStructurePluginConfig)?.lang === lang
  );
}

export function getPluginConfig(
  plugin: Plugin
): WordStructurePluginConfig | null {
  const config = plugin.config as WordStructurePluginConfig;
  if (!config || !config.lang || !config.packBaseUrl || !config.files) {
    return null;
  }
  return config;
}
