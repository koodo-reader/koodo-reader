import React from "react";
import "./popupStructure.css";
import { PopupStructureProps, PopupStructureState } from "./interface";
import {
  ensureNestPackLoaded,
  lookupWordStructure,
  addNestPackListener,
  getGloss,
  getGlossLangs,
  getDictionaryBreakdown,
  NestNode,
} from "../../../utils/reader/wordStructure/nestPack";
import {
  buildMorphemeBreakdown,
  Morpheme,
} from "../../../utils/reader/wordStructure/morphemeParse";
import {
  getLanguageProfile,
  guessTokenLanguage,
  LanguageProfile,
} from "../../../utils/reader/wordStructure/languageProfiles";
import {
  findWordStructurePlugin,
  getPluginConfig,
  WordStructurePluginConfig,
} from "../../../utils/reader/wordStructure/wordStructurePlugin";
import {
  resolveAiGlossModel,
  fetchAiGlosses,
  AiGlossModel,
} from "../../../utils/reader/wordStructure/aiGlossProvider";
import { getCachedBookLanguage } from "../../../utils/reader/wordStructure/bookLanguage";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { Trans } from "react-i18next";

const AI_GLOSS_CHOICE = "ai";

class PopupStructure extends React.Component<
  PopupStructureProps,
  PopupStructureState
> {
  private removeListener: (() => void) | null = null;
  private isUnmounted = false;
  private lang = "";
  private packConfig: WordStructurePluginConfig | null = null;
  private profile: LanguageProfile = getLanguageProfile("");
  private aiModel: AiGlossModel | null = null;
  private aiInFlight = 0;

  constructor(props: PopupStructureProps) {
    super(props);
    this.state = {
      status: "loading",
      loadPhase: "downloading",
      result: null,
      glossLang: ConfigService.getReaderConfig("wsGlossLang") || "",
      aiGlosses: {},
      aiRoot: null,
      aiPending: false,
    };
  }

  /**
   * Resolve the pack language for the clicked word: script decides directly
   * for Cyrillic; for Latin script the detected book language wins when a
   * plugin for it is installed, falling back to English.
   */
  resolveLanguage(): string {
    const script = guessTokenLanguage(this.props.originalText || "");
    if (script !== "en") return script;
    const bookLang = getCachedBookLanguage(this.props.currentBook?.key || "");
    for (const candidate of [bookLang, "en"]) {
      if (candidate && findWordStructurePlugin(this.props.plugins, candidate)) {
        return candidate;
      }
    }
    return bookLang || "en";
  }

  aiTargetLang() {
    return (
      ConfigService.getReaderConfig("wsGlossAiTarget") ||
      ConfigService.getReaderConfig("lang") ||
      navigator.language ||
      "en"
    );
  }

  aiEnabled() {
    return (
      this.aiModel !== null &&
      ConfigService.getReaderConfig("isDisableAI") !== "yes"
    );
  }

  requestAiGlosses(words: string[]) {
    const { result } = this.state;
    if (!result || !this.aiModel || !this.aiEnabled()) return;
    const rootMorpheme = this.rootMorphemeText() || result.root;
    this.aiInFlight += 1;
    this.setState({ aiPending: true });
    const settle = () => {
      this.aiInFlight -= 1;
      if (!this.isUnmounted && this.aiInFlight === 0) {
        this.setState({ aiPending: false });
      }
    };
    fetchAiGlosses(
      {
        lang: this.lang,
        rootMorpheme,
        rootExamples: result.chain.map((step) => step.word).slice(0, 6),
        words,
        targetLang: this.aiTargetLang(),
      },
      this.aiModel
    )
      .then((aiResult) => {
        if (!this.isUnmounted && aiResult) {
          // functional setState so overlapping responses merge instead of
          // clobbering each other
          this.setState((prev) => ({
            aiGlosses: { ...prev.aiGlosses, ...aiResult.glosses },
            aiRoot: aiResult.root ?? prev.aiRoot,
          }));
        }
      })
      .catch(() => {
        /* a failed request just leaves its words un-glossed */
      })
      .finally(settle);
  }

  /** family words the popup currently shows: lemma + chain + first tree level */
  visibleFamilyWords(): string[] {
    const { result } = this.state;
    if (!result) return [];
    const words = new Set<string>([result.lemma, result.root]);
    for (const step of result.chain) words.add(step.word);
    for (const child of result.tree.children) words.add(child.word);
    return Array.from(words);
  }

  rootMorphemeText(): string | null {
    const { result } = this.state;
    if (!result) return null;
    const morphemes =
      getDictionaryBreakdown(result.lemma, this.lang) ||
      buildMorphemeBreakdown(result.chain, result.lemma, this.profile.breakdown);
    return morphemes?.find((m) => m.role === "root")?.text || null;
  }

  componentDidMount() {
    this.lang = this.resolveLanguage();
    const plugin = this.lang
      ? findWordStructurePlugin(this.props.plugins, this.lang)
      : undefined;
    this.packConfig = plugin ? getPluginConfig(plugin) : null;
    this.aiModel = resolveAiGlossModel(this.props.plugins);
    if (!this.packConfig) {
      this.setState({ status: "no-plugin" });
      return;
    }
    this.profile = getLanguageProfile(this.lang, this.packConfig);
    this.removeListener = addNestPackListener((progress) => {
      if (
        !this.isUnmounted &&
        progress.lang === this.lang &&
        this.state.status === "loading"
      ) {
        this.setState({ loadPhase: progress.phase });
      }
    });
    ensureNestPackLoaded(this.packConfig)
      .then(() => {
        if (this.isUnmounted) return;
        const result = lookupWordStructure(
          this.props.originalText || "",
          this.lang
        );
        this.setState({ result, status: result ? "ready" : "empty" }, () => {
          if (!result || !this.aiEnabled()) return;
          const pure = this.currentGlossLang() === AI_GLOSS_CHOICE;
          // pure-AI mode glosses everything visible; fill mode only the
          // words the pack has no gloss for (plus the root-sense line)
          const words = this.visibleFamilyWords().filter(
            (word) =>
              pure || !getGloss(word, this.lang, this.currentGlossLang())
          );
          this.requestAiGlosses(words);
        });
      })
      .catch(() => {
        if (!this.isUnmounted) this.setState({ status: "error" });
      });
  }

  componentWillUnmount() {
    this.isUnmounted = true;
    if (this.removeListener) this.removeListener();
  }

  glossChoices(): string[] {
    const packLangs = this.lang ? getGlossLangs(this.lang) : [];
    return [...packLangs, ...(this.aiEnabled() ? [AI_GLOSS_CHOICE] : [])];
  }

  currentGlossLang() {
    const available = this.glossChoices();
    if (available.length === 0) return "";
    return available.includes(this.state.glossLang)
      ? this.state.glossLang
      : available[0];
  }

  handleGlossLang = (glossLang: string) => {
    ConfigService.setReaderConfig("wsGlossLang", glossLang);
    this.setState({ glossLang }, () => {
      if (!this.state.result || !this.aiEnabled()) return;
      const pure = glossLang === AI_GLOSS_CHOICE;
      const words = this.visibleFamilyWords().filter(
        (word) =>
          (pure || !getGloss(word, this.lang, glossLang)) &&
          this.state.aiGlosses[word] === undefined
      );
      if (words.length > 0) this.requestAiGlosses(words);
    });
  };

  handleTranslateWord = (word: string) => {
    this.props.handleOriginalText(word);
    this.props.handleMenuMode("trans");
    this.props.handleOpenMenu(true);
  };

  handleOpenPluginSettings = () => {
    this.props.handleOpenMenu(false);
    this.props.handleMenuMode("");
    this.props.handleSetting(true);
    this.props.handleSettingMode("plugins");
  };

  glossFor(word: string): { text: string; ai: boolean } | null {
    const choice = this.currentGlossLang();
    if (!choice) return null;
    if (choice === AI_GLOSS_CHOICE) {
      const ai = this.state.aiGlosses[word];
      return ai ? { text: ai, ai: true } : null;
    }
    const pack = getGloss(word, this.lang, choice);
    if (pack) return { text: pack, ai: false };
    const ai = this.state.aiGlosses[word];
    return ai ? { text: ai, ai: true } : null;
  }

  renderGlossText(gloss: { text: string; ai: boolean }) {
    return (
      <>
        {gloss.text}
        {gloss.ai ? <span className="structure-ai-badge">AI</span> : null}
      </>
    );
  }

  renderMorphemes(morphemes: Morpheme[]) {
    const plain = this.profile.notation !== "ru-school";
    const labels = this.profile.roleLabels;
    return (
      <>
        <div
          className={
            "structure-morphemes" + (plain ? " structure-morphemes-plain" : "")
          }
        >
          {morphemes.map((m, index) => (
            <span
              key={index}
              className={`structure-morpheme structure-morpheme-${m.role}`}
            >
              {m.text || " "}
            </span>
          ))}
        </div>
        <div className="structure-morpheme-legend">
          {morphemes.map((m, index) => (
            <span key={index} className="structure-morpheme-legend-item">
              <b>{m.text || "□"}</b> — {labels[m.role]}
            </span>
          ))}
        </div>
      </>
    );
  }

  renderAffix(affix: string, type: string) {
    if (!affix) return null;
    return (
      <span className="structure-affix">
        {type === "prefix" ? `${affix}-` : `-${affix}`}
      </span>
    );
  }

  renderPos(pos: string) {
    if (!pos || pos === "U") return null;
    return <span className={`structure-pos structure-pos-${pos}`}>{pos}</span>;
  }

  renderNode(node: NestNode, depth: number): React.ReactNode {
    const lemma = this.state.result?.lemma;
    const gloss = this.glossFor(node.word);
    const row = (
      <span
        className={
          "structure-node-row" +
          (node.word === lemma ? " structure-node-current" : "")
        }
        title={gloss?.text || undefined}
        onDoubleClick={() => this.handleTranslateWord(node.word)}
      >
        <span className="structure-node-word">{node.word}</span>
        {this.renderAffix(node.affix, node.type)}
        {this.renderPos(node.pos)}
        {gloss ? (
          <span className="structure-gloss structure-gloss-inline">
            {this.renderGlossText(gloss)}
          </span>
        ) : null}
      </span>
    );
    if (node.children.length === 0) {
      return <li key={node.word}>{row}</li>;
    }
    return (
      <li key={node.word}>
        <details open={depth < 1}>
          <summary>{row}</summary>
          <ul className="structure-tree">
            {node.children.map((child) => this.renderNode(child, depth + 1))}
          </ul>
        </details>
      </li>
    );
  }

  renderAttribution() {
    const parts = ["MorphyNet"];
    if (this.packConfig?.files.glosses) parts.push("OpenRussian");
    return parts.join(" · ") + " · CC BY-SA";
  }

  render() {
    const { status, result } = this.state;
    const glossChoices = this.glossChoices();
    return (
      <div className="structure-container">
        {status === "no-plugin" && (
          <>
            <div className="structure-word">{this.props.originalText}</div>
            <div className="structure-message">
              <Trans>No word structure plugin for this language</Trans>
            </div>
            <button
              type="button"
              className="structure-install-button"
              onClick={this.handleOpenPluginSettings}
            >
              <span className="icon-add" style={{ marginRight: 6 }}></span>
              <Trans>Install word structure plugin</Trans>
            </button>
          </>
        )}
        {status === "loading" && (
          <div className="structure-message">
            <Trans>
              {this.state.loadPhase === "parsing"
                ? "Building word family index"
                : "Loading word structure data"}
            </Trans>
            …
          </div>
        )}
        {status === "error" && (
          <div className="structure-message">
            <Trans>Failed to load word structure data</Trans>
          </div>
        )}
        {status === "empty" && (
          <>
            <div className="structure-word">{this.props.originalText}</div>
            <div className="structure-message">
              <Trans>No word formation data for this word</Trans>
            </div>
          </>
        )}
        {status === "ready" && result && (
          <>
            <div className="structure-word">
              {result.lemma}
              {this.renderPos(result.chain[result.chain.length - 1]?.pos || "")}
              <button
                type="button"
                className="structure-translate-link"
                title={this.props.t("Translate")}
                onClick={() => this.handleTranslateWord(result.lemma)}
              >
                ⇄
              </button>
            </div>
            {(() => {
              const gloss = this.glossFor(result.lemma);
              if (!gloss) return null;
              return (
                <div className="structure-gloss structure-gloss-lemma">
                  {this.renderGlossText(gloss)}
                </div>
              );
            })()}

            {(() => {
              // dictionary segmentation (морфо-ru) beats the synthesized one
              const morphemes =
                getDictionaryBreakdown(result.lemma, this.lang) ||
                buildMorphemeBreakdown(
                  result.chain,
                  result.lemma,
                  this.profile.breakdown
                );
              if (!morphemes) return null;
              return (
                <>
                  <div className="structure-section-title">
                    <Trans>Morpheme breakdown</Trans>
                  </div>
                  {this.renderMorphemes(morphemes)}
                </>
              );
            })()}

            {this.aiEnabled() && (this.state.aiRoot || this.state.aiPending) && (
              <div className="structure-root-sense">
                {this.profile.roleLabels.root}{" "}
                <b>{this.rootMorphemeText() || result.root}-</b> —{" "}
                {this.state.aiRoot || "…"}
                <span className="structure-ai-badge">AI</span>
              </div>
            )}

            <div className="structure-section-title">
              <Trans>Word formation</Trans>
            </div>
            <div className="structure-chain">
              {result.chain.map((step, index) => (
                <React.Fragment key={step.word}>
                  {index > 0 && (
                    <span className="structure-chain-arrow">→</span>
                  )}
                  <span
                    className={
                      "structure-chain-step" +
                      (step.word === result.lemma
                        ? " structure-node-current"
                        : "")
                    }
                  >
                    {index > 0 && this.renderAffix(step.affix, step.type)}
                    <span className="structure-node-word">{step.word}</span>
                  </span>
                </React.Fragment>
              ))}
            </div>

            <div className="structure-section-title">
              <Trans>Word family</Trans>
              <span className="structure-member-count">
                {result.memberCount}
              </span>
            </div>
            <div className="structure-tree-box">
              <ul className="structure-tree structure-tree-root">
                {this.renderNode(result.tree, 0)}
              </ul>
            </div>
          </>
        )}
        {status !== "no-plugin" && (
          <div className="structure-footer">
            <span className="structure-attribution">
              {this.renderAttribution()}
            </span>
            {glossChoices.length > 1 && (
              <span className="structure-gloss-switch">
                {glossChoices.map((choice) => (
                  <button
                    key={choice}
                    className={this.currentGlossLang() === choice ? "on" : ""}
                    onClick={() => this.handleGlossLang(choice)}
                  >
                    {choice === AI_GLOSS_CHOICE
                      ? `AI·${this.aiTargetLang().split("-")[0].toUpperCase()}`
                      : choice.toUpperCase()}
                  </button>
                ))}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default PopupStructure;
