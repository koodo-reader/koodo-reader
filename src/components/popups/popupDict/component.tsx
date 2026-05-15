import React from "react";
import "./popupDict.css";
import { PopupDictProps, PopupDictState } from "./interface";
import {
  ConfigService,
  KookitConfig,
} from "../../../assets/lib/kookit-extra-browser.min";
import Parser from "html-react-parser";
import DOMPurify from "dompurify";
import axios from "axios";
import DictHistory from "../../../models/DictHistory";
import { Trans } from "react-i18next";
import { getWebsiteUrl, openExternalUrl } from "../../../utils/common";
import toast from "react-hot-toast";
import DatabaseService from "../../../utils/storage/databaseService";
import {
  getDictText,
  getDictionaryStream,
} from "../../../utils/request/reader";
import { chatStream } from "../../../utils/request/common";
import { marked } from "marked";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import DictUtil from "../../../utils/file/dictUtil";
declare var window: any;
class PopupDict extends React.Component<PopupDictProps, PopupDictState> {
  private aiTextAccumulator: string = "";
  private updateInterval: ReturnType<typeof setInterval> | null = null;

  constructor(props: PopupDictProps) {
    super(props);
    this.state = {
      dictText: this.props.t("Please wait"),
      word: "",
      prototype: "",
      dictService: ConfigService.getReaderConfig("dictService"),
      dictTarget: ConfigService.getReaderConfig("dictTarget") || "",
      dictSource: ConfigService.getReaderConfig("dictSource") || "",
      isAddNew: false,
      isShowUrl: false,
      aiAnswer: "",
      isAiWaiting: false,
    };
  }

  private startUpdateInterval() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.updateInterval = setInterval(() => {
      if (this.aiTextAccumulator) {
        this.setState({ aiAnswer: this.aiTextAccumulator });
      }
    }, 150);
  }

  private stopUpdateInterval() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.aiTextAccumulator) {
      this.setState({ aiAnswer: this.aiTextAccumulator });
    }
  }
  componentDidMount() {
    this.handleLookUp();
  }
  async handleLookUp() {
    let originalText = this.props.originalText
      .replace(/(\r\n|\n|\r)/gm, "")
      .replace(/-/gm, "");
    this.setState({ word: originalText });
    // let prototype = "";
    this.setState({ prototype: originalText });
    if (ConfigService.getReaderConfig("isLemmatizeWord") === "yes") {
      originalText = originalText;
    }
    if (!this.state.dictService) {
      let pluginList = this.props.plugins.filter(
        (item) => item.type === "dictionary"
      );
      if (pluginList.length > 0) {
        this.setState({
          dictService: pluginList[0].key,
        });
        ConfigService.setReaderConfig("dictService", pluginList[0].key);
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        this.setState({ isAddNew: true });
        return;
      }
    }
    const dictText = await this.handleDict(originalText);
    this.handleRecordHistory(
      originalText,
      this.props.originalSentence || "",
      dictText || ""
    );
  }
  handleRecordHistory = async (
    text: string,
    sentence: string,
    dictText: string = ""
  ) => {
    let bookKey = this.props.currentBook.key;
    let bookLocation = ConfigService.getObjectConfig(
      bookKey,
      "recordLocation",
      {}
    );
    let chapter = bookLocation.chapterTitle || "";
    let bookName = this.props.currentBook.name || "";
    let word = new DictHistory(bookKey, text, chapter, sentence);
    await DatabaseService.saveRecord(word, "words");
    this.syncWordToEudic(text, sentence);
    this.syncWordToAnki(text, sentence, bookName, chapter, dictText);
  };

  syncWordToEudic = async (text: string, sentence: string) => {
    if (ConfigService.getReaderConfig("isEnableEudicSync") !== "yes") return;
    try {
      const config = ConfigService.getObjectConfig(
        "eudicSyncConfig",
        "thirdpartyToken",
        {}
      ) as any;
      if (!config || !config.accessToken) return;
      const language = config.language || "en";
      const headers = {
        Authorization: `NIS ${config.accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
      };

      // Resolve categoryId from name, use cached value if available
      let categoryId: string = "0";
      const categoryName: string = (config.categoryName || "").trim();
      if (categoryName) {
        if (config.categoryId !== undefined) {
          // Use cached id
          categoryId = config.categoryId;
        } else {
          // Fetch all study lists and find matching one
          const listRes = await axios.get(
            `https://api.frdic.com/api/open/v1/studylist/category?language=${language}`,
            { headers }
          );
          const lists: { id: string; name: string }[] =
            listRes.data?.data || [];
          const matched = lists.find((item) => item.name === categoryName);
          if (matched) {
            categoryId = matched.id || "0";
          }
          // Cache the resolved id alongside the name it was resolved from
          const updatedConfig = {
            ...config,
            categoryId: categoryId,
          };
          ConfigService.setObjectConfig(
            "eudicSyncConfig",
            updatedConfig,
            "thirdpartyToken"
          );
        }
      }

      await axios.post(
        "https://api.frdic.com/api/open/v1/studylist/word",
        {
          language,
          word: text,
          context_line: sentence || "",
          category_ids: [categoryId],
        },
        { headers }
      );
    } catch (error) {
      console.error("Eudic sync error:", error);
    }
  };

  syncWordToAnki = async (
    text: string,
    sentence: string,
    bookName: string,
    chapter: string,
    dictText: string = ""
  ) => {
    if (ConfigService.getReaderConfig("isEnableAnkiSync") !== "yes") return;
    try {
      const config = ConfigService.getObjectConfig(
        "ankiSyncConfig",
        "thirdpartyToken",
        {}
      ) as any;
      if (!config || !config.deckName) return;
      const host = config.host || "127.0.0.1";
      const port = config.port || "8765";
      const endpoint = `http://${host}:${port}`;
      const deckName = config.deckName;
      const MODEL_NAME = "Koodo Reader Word";

      const ankiRequest = (action: string, params: any = {}) => {
        const body: any = { action, version: 6, params };
        if (config.apiKey) body.key = config.apiKey;
        return axios.post(endpoint, body);
      };

      // Ensure model exists; create once and cache in config
      if (!config.modelName) {
        const namesRes = await ankiRequest("modelNames");
        const existingModels: string[] = namesRes.data?.result || [];
        if (!existingModels.includes(MODEL_NAME)) {
          await ankiRequest("createModel", {
            modelName: MODEL_NAME,
            inOrderFields: [
              "Word",
              "Sentence",
              "Book",
              "Chapter",
              "Definition",
            ],
            cardTemplates: [
              {
                Name: "Card 1",
                Front:
                  "<b>{{Word}}</b><br><br>{{Sentence}}<br><br><i>{{Book}}</i><br>{{Chapter}}",
                Back: "{{Definition}}",
              },
            ],
          });
        }
        // Cache so we skip this check next time
        ConfigService.setObjectConfig(
          "ankiSyncConfig",
          { ...config, modelName: MODEL_NAME },
          "thirdpartyToken"
        );
      }

      await ankiRequest("addNote", {
        note: {
          deckName,
          modelName: MODEL_NAME,
          fields: {
            Word: text,
            Sentence: sentence || "",
            Book: bookName || "",
            Chapter: chapter || "",
            Definition: dictText || "",
          },
          options: { allowDuplicate: false },
          tags: [],
        },
      });
    } catch (error) {
      console.error("AnkiConnect sync error:", error);
    }
  };

  handleDict = async (text: string): Promise<string> => {
    let dictText = "";
    let isFullAnalysis = true;
    try {
      if (this.state.dictService === "custom-ai-dict-plugin") {
        this.setState({ isAddNew: false });
        let plugin = this.props.plugins.find(
          (item) => item.key === "custom-ai-dict-plugin"
        );
        if (!plugin) return "";
        let targetLang =
          this.state.dictTarget ||
          ConfigService.getReaderConfig("dictTarget") ||
          KookitConfig.ConvertLangMap[
            ConfigService.getReaderConfig("lang") || "zhCN"
          ];
        let systemPrompt =
          ConfigService.getReaderConfig("aiDictPrompt") ||
          KookitConfig.DefaultPrompts.aiDict;
        systemPrompt = systemPrompt.replace("{word}", text);
        systemPrompt = systemPrompt.replace("{to}", targetLang);
        let config: any = plugin.config || {};
        this.aiTextAccumulator = "";
        this.setState({ aiAnswer: "", isAiWaiting: true });
        this.startUpdateInterval();
        await chatStream(
          config.endpoint,
          config.providerId,
          config.apiKey,
          config.modelId,
          systemPrompt,
          [],
          (result) => {
            if (result && result.done) {
              return;
            }
            if (result && result.text) {
              if (!this.aiTextAccumulator) {
                this.setState({ isAiWaiting: false });
              }
              this.aiTextAccumulator += result.text;
            }
          }
        );
        this.stopUpdateInterval();
        this.aiTextAccumulator = "";
        this.setState({ isAiWaiting: false, dictText: " " });
        return "";
      } else if (
        this.state.dictService &&
        this.state.dictService.startsWith("dict_")
      ) {
        this.setState({ isAddNew: false });
        const plugin = this.props.plugins.find(
          (item) => item.key === this.state.dictService
        );
        if (!plugin) return "";
        const config: any = plugin.config || {};
        const dictId: string = config.dictId || "";
        if (!dictId) return "";
        dictText = await DictUtil.lookupWord(dictId, text);
      } else if (
        this.state.dictService &&
        this.state.dictService !== "official-ai-dict-plugin"
      ) {
        let plugin = this.props.plugins.find(
          (item) => item.key === this.state.dictService
        );
        if (!plugin) return "";
        let dictFunc = plugin.script;
        // eslint-disable-next-line no-eval
        eval(dictFunc);
        dictText = await window.getDictText(
          text,
          "auto",
          this.state.dictTarget || "en",
          axios,
          this.props.t,
          plugin.config
        );
      } else if (
        this.props.isAuthed &&
        ConfigService.getReaderConfig("isDisableAI") !== "yes"
      ) {
        this.setState({
          dictService: "official-ai-dict-plugin",
          isAddNew: false,
        });
        dictText = await getDictText(
          text,
          ConfigService.getReaderConfig("dictTarget") || "auto",
          ConfigService.getReaderConfig("lang") &&
            ConfigService.getReaderConfig("lang").startsWith("zh")
            ? "chs"
            : "eng"
        );
        if (dictText) {
          isFullAnalysis = false;
        }
      }

      if (dictText.startsWith("https://")) {
        openExternalUrl(dictText, true, "dict");
        let docs = getIframeDoc(this.props.currentBook.format);
        for (let i = 0; i < docs.length; i++) {
          let doc = docs[i];
          if (!doc) continue;
          doc.getSelection()?.empty();
        }
        return "";
      } else {
        this.setState(
          {
            dictText: dictText,
          },
          () => {
            let moreElement = document.querySelector(".dict-learn-more");
            if (moreElement) {
              moreElement.addEventListener("click", () => {
                openExternalUrl(window.learnMoreUrl || getWebsiteUrl());
              });
            }
          }
        );
      }
      if (
        this.props.isAuthed &&
        ConfigService.getReaderConfig("isDisableAI") !== "yes" &&
        this.state.dictService === "official-ai-dict-plugin"
      ) {
        this.handleDictionaryStream(text, isFullAnalysis);
      }
      return dictText;
    } catch (error) {
      toast.error(
        this.props.t("Error happened") +
          ": " +
          (error instanceof Error ? error.message : String(error))
      );
      console.error(error);
      this.setState({
        dictText: this.props.t("Error happened"),
      });
      return "";
    }
  };
  handleDictionaryStream = async (text: string, isFullAnalysis: boolean) => {
    try {
      this.aiTextAccumulator = "";
      this.setState({ aiAnswer: "", isAiWaiting: true });
      this.startUpdateInterval();
      let res = await getDictionaryStream(
        text,
        "auto",
        navigator.language,
        this.props.originalSentence,
        isFullAnalysis,
        (result) => {
          if (result && result.text) {
            if (!this.aiTextAccumulator) {
              this.setState({ isAiWaiting: false });
            }
            this.aiTextAccumulator += result.text;
          }
        }
      );
      this.stopUpdateInterval();
      this.aiTextAccumulator = "";
      if (res && res.done) {
        this.setState({ isAiWaiting: false });
      }
    } catch (error) {
      this.stopUpdateInterval();
      this.aiTextAccumulator = "";
      this.setState({ isAiWaiting: false });
      console.error(error);
    }
  };
  handleChangeDictService = (dictService: string) => {
    this.setState(
      {
        dictService: dictService,
        isAddNew: false,
      },
      () => {
        ConfigService.setReaderConfig("dictService", dictService);
        this.setState(
          {
            dictTarget: "en",
          },
          () => {
            ConfigService.setReaderConfig("dictTarget", "en");
            this.handleLookUp();
          }
        );
      }
    );
  };

  render() {
    const renderDictBox = () => {
      return (
        <div className="dict-container">
          <div className="dict-service-container">
            <select
              className="dict-service-selector"
              style={{ margin: 0 }}
              value={this.state.dictService}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                if (event.target.value === "add-new") {
                  this.props.handleOpenMenu(false);
                  this.props.handleMenuMode("");
                  this.props.handleSetting(true);
                  this.props.handleSettingMode("plugins");
                  return;
                }
                this.handleChangeDictService(event.target.value);
              }}
            >
              <option
                value={""}
                key={"select"}
                className="add-dialog-shelf-list-option"
              >
                {this.props.t("Please select")}
              </option>
              {this.props.plugins
                .filter((item) => item.type === "dictionary")
                .map((item) => {
                  return (
                    <option
                      value={item.key}
                      key={item.key}
                      className="add-dialog-shelf-list-option"
                    >
                      {this.props.t(item.displayName)}
                    </option>
                  );
                })}
              <option
                value={"add-new"}
                key={"add-new"}
                className="add-dialog-shelf-list-option"
              >
                {this.props.t("Add new plugin")}
              </option>
            </select>
          </div>

          <div className="dict-service-container" style={{ right: 150 }}>
            <select
              className="dict-service-selector"
              style={{ margin: 0 }}
              value={this.state.dictTarget}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                this.setState(
                  {
                    dictTarget: event.target.value || "en",
                  },
                  () => {
                    ConfigService.setReaderConfig(
                      "dictTarget",
                      event.target.value
                    );
                    this.handleLookUp();
                  }
                );
              }}
            >
              {this.props.plugins.find(
                (item) => item.key === this.state.dictService
              )?.langList &&
                (
                  this.props.plugins.find(
                    (item) => item.key === this.state.dictService
                  )?.langList as any[]
                ).map((item) => {
                  return (
                    <option
                      value={item.code}
                      key={item.code}
                      className="add-dialog-shelf-list-option"
                    >
                      {this.props.t(item["nativeLang"])}
                    </option>
                  );
                })}
            </select>
          </div>
          <div className="dict-word">
            {ConfigService.getReaderConfig("isLemmatizeWord") === "yes"
              ? this.state.prototype
              : this.state.word}
          </div>
          <div className="dict-original-word">
            <Trans>Prototype</Trans>
            <span>:</span>
            <span>{this.state.prototype}</span>
          </div>
          {this.state.isAddNew && (
            <div
              style={{
                marginTop: "50px",
                textAlign: "center",
                fontSize: "17px",
                color: "#2084e8",
              }}
            >
              <span
                style={{
                  textDecoration: "underline",
                  cursor: "pointer",
                  textAlign: "center",
                }}
                onClick={() => {
                  this.props.handleOpenMenu(false);
                  this.props.handleMenuMode("");
                  this.props.handleSetting(true);
                  this.props.handleSettingMode("plugins");
                }}
              >
                <Trans>Add new plugin</Trans>
              </span>
            </div>
          )}
          {!this.state.isAddNew && (
            <div className="dict-text-box">
              {Parser(
                DOMPurify.sanitize(
                  this.state.dictText + "<address></address>"
                ) || " ",
                {
                  replace: (_domNode) => {},
                }
              )}
              {(this.state.isAiWaiting || this.state.aiAnswer) && (
                <div className="dict-ai-answer-container">
                  <div className="dict-ai-answer-title">
                    <span className="icon-idea dict-ai-answer-icon"></span>
                    <Trans>AI Encyclopedia</Trans>
                  </div>
                  {this.state.isAiWaiting && !this.state.aiAnswer ? (
                    <div className="dict-ai-answer-waiting">
                      <span className="icon-loading popup-assistant-loading"></span>
                      <span>{this.props.t("Thinking, please wait...")}</span>
                    </div>
                  ) : (
                    <div className="dict-ai-answer-content">
                      {Parser(
                        DOMPurify.sanitize(
                          (marked.parse(this.state.aiAnswer) as string) +
                            "<address></address>"
                        ) || " ",
                        {
                          replace: (_domNode) => {},
                        }
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    };
    return renderDictBox();
  }
}
export default PopupDict;
