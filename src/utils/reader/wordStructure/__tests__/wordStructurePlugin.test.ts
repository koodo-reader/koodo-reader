/**
 * @jest-environment jsdom
 */

import { describe, expect, test } from "@jest/globals";
import Plugin from "../../../../models/Plugin";
import {
  WORD_STRUCTURE_PLUGIN_TYPE,
  getWordStructurePlugins,
  findWordStructurePlugin,
  getPluginConfig,
} from "../wordStructurePlugin";

function makePlugin(type: string, config: object): Plugin {
  return new Plugin(
    `${type}-test`,
    type,
    "Test",
    "convert-text",
    "1.0.0",
    "",
    config,
    [],
    [],
    "",
    ""
  );
}

const RU_CONFIG = {
  lang: "ru",
  packVersion: "1.0.0",
  packBaseUrl: "assets/word-structure",
  files: { nests: "n.tsv", forms: "f.tsv" },
};

describe("wordStructurePlugin helpers", () => {
  test("filters plugins by the word-structure type", () => {
    const plugins = [
      makePlugin("translation", {}),
      makePlugin(WORD_STRUCTURE_PLUGIN_TYPE, RU_CONFIG),
      makePlugin("dictionary", {}),
    ];
    expect(getWordStructurePlugins(plugins)).toHaveLength(1);
  });

  test("finds the plugin for a language via its config", () => {
    const ru = makePlugin(WORD_STRUCTURE_PLUGIN_TYPE, RU_CONFIG);
    const en = makePlugin(WORD_STRUCTURE_PLUGIN_TYPE, {
      ...RU_CONFIG,
      lang: "en",
    });
    expect(findWordStructurePlugin([ru, en], "en")).toBe(en);
    expect(findWordStructurePlugin([ru, en], "ru")).toBe(ru);
    expect(findWordStructurePlugin([ru, en], "de")).toBeUndefined();
  });

  test("getPluginConfig validates required manifest fields", () => {
    expect(
      getPluginConfig(makePlugin(WORD_STRUCTURE_PLUGIN_TYPE, RU_CONFIG))
    ).not.toBeNull();
    expect(
      getPluginConfig(makePlugin(WORD_STRUCTURE_PLUGIN_TYPE, {}))
    ).toBeNull();
    expect(
      getPluginConfig(
        makePlugin(WORD_STRUCTURE_PLUGIN_TYPE, { lang: "ru" })
      )
    ).toBeNull();
    expect(
      getPluginConfig(
        makePlugin(WORD_STRUCTURE_PLUGIN_TYPE, {
          lang: "ru",
          packBaseUrl: "x",
        })
      )
    ).toBeNull();
  });
});
