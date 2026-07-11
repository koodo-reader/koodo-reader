/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const mockChatStream = jest.fn();
jest.mock("../../../request/common", () => ({
  chatStream: (...args: any[]) => (mockChatStream as any)(...args),
}));

import Plugin from "../../../../models/Plugin";
import {
  resolveAiGlossModel,
  buildGlossPrompt,
  parseGlossResponse,
  fetchAiGlosses,
  __resetAiGlossCacheForTesting,
} from "../aiGlossProvider";

const MODEL = {
  endpoint: "https://api.example.com/v1",
  providerId: "openai",
  apiKey: "sk-test",
  modelId: "test-model",
};

function makeAiPlugin(key: string, config: object): Plugin {
  return new Plugin(key, "dictionary", key, "dict", "1", "", config, [], [], "", "");
}

function streamReply(reply: string) {
  mockChatStream.mockImplementation(
    async (
      _url: any,
      _provider: any,
      _key: any,
      _model: any,
      _prompt: any,
      _chat: any,
      onMessage: any
    ) => {
      // simulate streaming in two chunks
      onMessage({ text: reply.slice(0, 5) });
      onMessage({ text: reply.slice(5) });
      return { done: true };
    }
  );
}

describe("aiGlossProvider", () => {
  beforeEach(() => {
    __resetAiGlossCacheForTesting();
    mockChatStream.mockReset();
    // jsdom has no IndexedDB — the provider must degrade to memory cache;
    // clean it when a fake implementation is present
    if (typeof indexedDB !== "undefined") {
      indexedDB.deleteDatabase("KoodoWsGlossCache");
    }
  });

  test("resolves the model from custom AI plugins, dict first", () => {
    const dict = makeAiPlugin("custom-ai-dict-plugin", MODEL);
    const trans = makeAiPlugin("custom-ai-trans-plugin", {
      ...MODEL,
      modelId: "trans-model",
    });
    expect(resolveAiGlossModel([trans, dict])!.modelId).toBe("test-model");
    expect(resolveAiGlossModel([trans])!.modelId).toBe("trans-model");
    expect(resolveAiGlossModel([])).toBeNull();
    expect(
      resolveAiGlossModel([makeAiPlugin("custom-ai-dict-plugin", {})])
    ).toBeNull();
  });

  test("prompt contains the confirmed structure and strict-JSON contract", () => {
    const prompt = buildGlossPrompt({
      lang: "ru",
      rootMorpheme: "зна",
      rootExamples: ["знать", "знание"],
      words: ["перевод", "переводить"],
      targetLang: "zh-CN",
    });
    expect(prompt).toContain('"зна"');
    expect(prompt).toContain("знать, знание");
    expect(prompt).toContain('["перевод","переводить"]');
    expect(prompt).toContain("Simplified Chinese");
    expect(prompt).toContain("STRICT JSON");
    expect(prompt).toContain("never add, remove or re-segment");
  });

  test("parses plain and fenced JSON, coerces unknown values to null", () => {
    const expected = ["а", "б"];
    expect(
      parseGlossResponse('{"root":"знать","glosses":{"а":"x","б":"y"}}', expected)
    ).toEqual({ root: "знать", glosses: { а: "x", б: "y" } });
    expect(
      parseGlossResponse(
        '```json\n{"root":null,"glosses":{"а":"x","б":null}}\n```',
        expected
      )
    ).toEqual({ root: null, glosses: { а: "x", б: null } });
    // words missing from the reply resolve to null, extra words are ignored
    expect(
      parseGlossResponse('{"root":"r","glosses":{"а":"x","в":"junk"}}', expected)
    ).toEqual({ root: "r", glosses: { а: "x", б: null } });
    expect(parseGlossResponse("not json at all", expected)).toBeNull();
    expect(parseGlossResponse('{"no":"glosses"}', expected)).toBeNull();
  });

  test("fetches, parses and caches; repeat call issues no second request", async () => {
    streamReply('{"root":"知道","glosses":{"знание":"知识","признать":"承认"}}');
    const request = {
      lang: "ru",
      rootMorpheme: "зна",
      rootExamples: ["знать"],
      words: ["знание", "признать"],
      targetLang: "zh-CN",
    };
    const first = await fetchAiGlosses(request, MODEL);
    expect(first).toEqual({
      root: "知道",
      glosses: { знание: "知识", признать: "承认" },
    });
    expect(mockChatStream).toHaveBeenCalledTimes(1);

    const second = await fetchAiGlosses(request, MODEL);
    expect(second).toEqual(first);
    expect(mockChatStream).toHaveBeenCalledTimes(1); // cache hit, no new call
  });

  test("a failed stream returns null and does not poison the cache", async () => {
    mockChatStream.mockImplementation(async () => {
      throw new Error("network");
    });
    const request = {
      lang: "ru",
      rootMorpheme: "зна",
      rootExamples: ["знать"],
      words: ["знание"],
      targetLang: "en",
    };
    expect(await fetchAiGlosses(request, MODEL)).toBeNull();
    // recovery: a later successful call works
    streamReply('{"root":"to know","glosses":{"знание":"knowledge"}}');
    expect((await fetchAiGlosses(request, MODEL))!.glosses["знание"]).toBe(
      "knowledge"
    );
  });

  test("different target languages cache independently", async () => {
    streamReply('{"root":"知道","glosses":{"знание":"知识"}}');
    const base = {
      lang: "ru",
      rootMorpheme: "зна",
      rootExamples: ["знать"],
      words: ["знание"],
    };
    await fetchAiGlosses({ ...base, targetLang: "zh-CN" }, MODEL);
    streamReply('{"root":"wissen","glosses":{"знание":"Wissen"}}');
    const de = await fetchAiGlosses({ ...base, targetLang: "de" }, MODEL);
    expect(de!.glosses["знание"]).toBe("Wissen");
    expect(mockChatStream).toHaveBeenCalledTimes(2);
  });
});
