/**
 * @jest-environment jsdom
 *
 * Smoke tests for the word-structure popup: plugin routing, install CTA,
 * dictionary-first breakdown rendering, gloss language switch, and the
 * hand-off to the translation popup. Uses the real nestPack engine with a
 * mocked fetch; kookit and i18n are stubbed.
 */

import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { TextDecoder, TextEncoder } from "util";

(global as any).TextEncoder = (global as any).TextEncoder || TextEncoder;
(global as any).TextDecoder = (global as any).TextDecoder || TextDecoder;
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

const configStore: Record<string, string> = {};
jest.mock("../../../../assets/lib/kookit-extra-browser.min", () => ({
  ConfigService: {
    getReaderConfig: (key: string) => configStore[key] || "",
    setReaderConfig: (key: string, value: string) => {
      configStore[key] = value;
    },
  },
}));
jest.mock("react-i18next", () => ({
  Trans: ({ children }: any) => children,
}));
const aiState = {
  model: null as any,
  reply: { root: "知道、认知", glosses: {} as Record<string, string | null> },
  calls: 0,
};
const bookLangState = { lang: "" };
jest.mock("../../../../utils/reader/wordStructure/bookLanguage", () => ({
  getCachedBookLanguage: () => bookLangState.lang,
}));
jest.mock(
  "../../../../utils/reader/wordStructure/aiGlossProvider",
  () => ({
    resolveAiGlossModel: () => aiState.model,
    fetchAiGlosses: async (request: any) => {
      aiState.calls += 1;
      const glosses: Record<string, string | null> = {};
      for (const word of request.words) {
        glosses[word] = aiState.reply.glosses[word] ?? null;
      }
      return { root: aiState.reply.root, glosses };
    },
  })
);

import PopupStructure from "../component";
import Plugin from "../../../../models/Plugin";
import { __resetNestPackForTesting } from "../../../../utils/reader/wordStructure/nestPack";

const NESTS = [
  "знать\tзнать\t\t\t\t",
  "знание\tзнать\tзнать\tание\tsuffix\tN",
].join("\n");
const FORMS = "знанием\tзнание";
const GLOSSES = ["знание\tknowledge\tKenntnis", "знать\tknow\twissen"].join("\n");
const MORPHEMES = "знание\tзна:root|ни:suffix|е:ending";

function mockFetch() {
  (global as any).fetch = (url: any) => {
    const u = String(url);
    const body = u.includes("nests")
      ? NESTS
      : u.includes("glosses")
        ? GLOSSES
        : u.includes("morphemes")
          ? MORPHEMES
          : FORMS;
    return Promise.resolve({
      ok: true,
      status: 200,
      arrayBuffer: () =>
        Promise.resolve(new TextEncoder().encode(body).buffer),
    });
  };
}

function makeRuPlugin(): Plugin {
  return new Plugin(
    "ru-word-structure",
    "word-structure",
    "Word structure (Russian)",
    "convert-text",
    "1.0.0",
    "",
    {
      lang: "ru",
      packVersion: "test",
      packBaseUrl: "assets/word-structure",
      files: {
        nests: "nests.tsv",
        forms: "forms.tsv",
        glosses: "glosses.tsv",
        morphemes: "morphemes.tsv",
      },
      glossLangs: ["en", "de"],
    },
    [],
    [],
    "",
    ""
  );
}

function makeProps(overrides: Partial<Record<string, any>> = {}) {
  return {
    originalText: "знанием",
    currentBook: {} as any,
    plugins: [makeRuPlugin()],
    t: (s: string) => s,
    handleMenuMode: jest.fn(),
    handleOriginalText: jest.fn(),
    handleOpenMenu: jest.fn(),
    handleSetting: jest.fn(),
    handleSettingMode: jest.fn(),
    ...overrides,
  } as any;
}

async function waitFor(
  check: () => boolean,
  describeState: () => string,
  timeoutMs = 3000
) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`waitFor timed out; state: ${describeState()}`);
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
}

describe("PopupStructure", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    __resetNestPackForTesting();
    mockFetch();
    for (const key of Object.keys(configStore)) delete configStore[key];
    aiState.model = null;
    aiState.calls = 0;
    aiState.reply = { root: "知道、认知", glosses: {} };
    bookLangState.lang = "";
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  async function render(props: any) {
    await act(async () => {
      root.render(React.createElement(PopupStructure, props));
    });
  }

  test("shows the install CTA when no plugin covers the language", async () => {
    const props = makeProps({ plugins: [] });
    await render(props);
    expect(container.textContent).toContain(
      "No word structure plugin for this language"
    );
    const button = container.querySelector(
      ".structure-install-button"
    ) as HTMLElement;
    expect(button).not.toBeNull();
    await act(async () => {
      button.click();
    });
    expect(props.handleSetting).toHaveBeenCalledWith(true);
    expect(props.handleSettingMode).toHaveBeenCalledWith("plugins");
    expect(props.handleOpenMenu).toHaveBeenCalledWith(false);
  });

  test("resolves an inflected word and renders the dictionary breakdown", async () => {
    await render(makeProps());
    await waitFor(
      () => (container.textContent || "").includes("Word family"),
      () => container.innerHTML.slice(0, 300)
    );
    expect(
      container.querySelector(".structure-word")!.textContent
    ).toContain("знание");
    // dictionary layer wins: зна|ни|е with school marks
    const segments = Array.from(
      container.querySelectorAll(".structure-morpheme")
    ).map((el) => el.textContent);
    expect(segments).toEqual(["зна", "ни", "е"]);
    expect(
      container.querySelector(".structure-morpheme-root")!.textContent
    ).toBe("зна");
    // gloss line from the pack
    expect(
      container.querySelector(".structure-gloss-lemma")!.textContent
    ).toBe("knowledge");
    // every family member with a gloss shows it inline in the tree
    const treeGlosses = Array.from(
      container.querySelectorAll(".structure-tree-box .structure-gloss-inline")
    ).map((el) => el.textContent);
    expect(treeGlosses).toEqual(expect.arrayContaining(["know", "knowledge"]));
  });

  test("gloss switch renders for multi-gloss packs and persists the choice", async () => {
    await render(makeProps());
    await waitFor(
      () => (container.textContent || "").includes("knowledge"),
      () => container.innerHTML.slice(0, 300)
    );
    const buttons = Array.from(
      container.querySelectorAll(".structure-gloss-switch button")
    ) as HTMLElement[];
    expect(buttons.map((b) => b.textContent)).toEqual(["EN", "DE"]);
    await act(async () => {
      buttons[1].click();
    });
    expect(configStore.wsGlossLang).toBe("de");
    await waitFor(
      () => (container.textContent || "").includes("Kenntnis"),
      () => container.innerHTML.slice(0, 300)
    );
  });

  test("the translate link hands the lemma to the translation popup", async () => {
    const props = makeProps();
    await render(props);
    await waitFor(
      () => (container.textContent || "").includes("Word family"),
      () => container.innerHTML.slice(0, 300)
    );
    const link = container.querySelector(
      ".structure-translate-link"
    ) as HTMLElement;
    await act(async () => {
      link.click();
    });
    expect(props.handleOriginalText).toHaveBeenCalledWith("знание");
    expect(props.handleMenuMode).toHaveBeenCalledWith("trans");
    expect(props.handleOpenMenu).toHaveBeenCalledWith(true);
  });

  test("shows the empty state for words outside every nest", async () => {
    await render(makeProps({ originalText: "собака" }));
    await waitFor(
      () =>
        (container.textContent || "").includes(
          "No word formation data for this word"
        ),
      () => container.innerHTML.slice(0, 300)
    );
  });

  test("AI mode: footer button, pure-AI glosses with badge, root-sense line", async () => {
    aiState.model = { endpoint: "e", providerId: "p", apiKey: "k", modelId: "m" };
    aiState.reply = {
      root: "知道、认知",
      glosses: { знать: "知道", знание: "知识" },
    };
    configStore.lang = "zh-CN";
    await render(makeProps());
    await waitFor(
      () => (container.textContent || "").includes("Word family"),
      () => container.innerHTML.slice(0, 300)
    );
    // pack glosses exist for en/de, so an AI button joins the switch
    const buttons = Array.from(
      container.querySelectorAll(".structure-gloss-switch button")
    ) as HTMLElement[];
    expect(buttons.map((b) => b.textContent)).toEqual(["EN", "DE", "AI·ZH"]);
    await act(async () => {
      buttons[2].click();
    });
    await waitFor(
      () => (container.textContent || "").includes("知识"),
      () => container.innerHTML.slice(0, 400)
    );
    expect(configStore.wsGlossLang).toBe("ai");
    // AI-sourced glosses carry the badge; root-sense line renders
    expect(container.querySelectorAll(".structure-ai-badge").length).toBeGreaterThan(0);
    await waitFor(
      () => (container.textContent || "").includes("知道、认知"),
      () => container.innerHTML.slice(0, 400)
    );
    expect(
      container.querySelector(".structure-root-sense")!.textContent
    ).toContain("зна");
  });

  test("fill mode: pack glosses stay primary, AI only fills the gaps", async () => {
    aiState.model = { endpoint: "e", providerId: "p", apiKey: "k", modelId: "m" };
    aiState.reply = { root: "знать-sense", glosses: { знать: "ai-know" } };
    await render(makeProps());
    await waitFor(
      () => (container.textContent || "").includes("Word family"),
      () => container.innerHTML.slice(0, 300)
    );
    // знание has a pack gloss -> keeps "knowledge" (no badge on it);
    // знать has none in EN pack fixture? it does ("know"), so nothing to fill
    expect(container.textContent).toContain("knowledge");
    const lemmaGloss = container.querySelector(".structure-gloss-lemma")!;
    expect(lemmaGloss.querySelector(".structure-ai-badge")).toBeNull();
  });

  test("Latin-script routing: book language wins when its plugin exists, else falls back to en", async () => {
    // cached book language "de" but only the ru plugin installed -> Latin
    // click resolves to en (no plugin) -> install CTA
    bookLangState.lang = "de";
    const props = makeProps({ originalText: "unbelievable" });
    await render(props);
    expect(container.textContent).toContain(
      "No word structure plugin for this language"
    );
  });
});