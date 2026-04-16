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
declare var window: any;
class PopupDict extends React.Component<PopupDictProps, PopupDictState> {
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
    this.handleDict(originalText);
    this.handleRecordHistory(originalText, this.props.originalSentence || "");
  }
  handleRecordHistory = async (text: string, sentence: string) => {
    let bookKey = this.props.currentBook.key;
    let bookLocation = ConfigService.getObjectConfig(
      bookKey,
      "recordLocation",
      {}
    );
    let chapter = bookLocation.chapterTitle;
    let word = new DictHistory(bookKey, text, chapter, sentence);
    await DatabaseService.saveRecord(word, "words");
  };
  handleDict = async (text: string) => {
    let dictText = "";
    let isFullAnalysis = true;
    try {
      if (this.state.dictService === "custom-ai-dict-plugin") {
        this.setState({ isAddNew: false });
        let plugin = this.props.plugins.find(
          (item) => item.key === "custom-ai-dict-plugin"
        );
        if (!plugin) return;
        let isFirst = true;
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
        this.setState({ aiAnswer: "", isAiWaiting: true });
        await chatStream(
          config.endpoint,
          config.providerId,
          config.apiKey,
          config.modelId,
          systemPrompt,
          [],
          (result) => {
            if (result && result.done) {
              this.setState({ isAiWaiting: false });
              return;
            }
            if (result && result.text) {
              if (isFirst) {
                this.setState({
                  aiAnswer: result.text,
                  isAiWaiting: false,
                });
                isFirst = false;
              } else {
                this.setState({
                  aiAnswer: this.state.aiAnswer + result.text,
                });
              }
            }
          }
        );
        this.setState({ isAiWaiting: false, dictText: " " });
        return;
      } else if (
        this.state.dictService &&
        this.state.dictService !== "official-ai-dict-plugin"
      ) {
        let plugin = this.props.plugins.find(
          (item) => item.key === this.state.dictService
        );
        if (!plugin) return;
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
    }
  };
  handleDictionaryStream = async (text: string, isFullAnalysis: boolean) => {
    try {
      this.setState({ aiAnswer: "", isAiWaiting: true });
      let isFirst = true;
      let res = await getDictionaryStream(
        text,
        "auto",
        navigator.language,
        this.props.originalSentence,
        isFullAnalysis,
        (result) => {
          if (result && result.text) {
            if (isFirst) {
              this.setState({ aiAnswer: result.text, isAiWaiting: false });
              isFirst = false;
            } else {
              this.setState({ aiAnswer: this.state.aiAnswer + result.text });
            }
          }
        }
      );
      if (res && res.done) {
        this.setState({ isAiWaiting: false });
      }
    } catch (error) {
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
                      selected={
                        this.state.dictService === item.key ? true : false
                      }
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
                      selected={
                        this.state.dictTarget === item.code ? true : false
                      }
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
