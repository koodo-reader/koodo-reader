import React from "react";
import "./popupDict.css";
import { PopupDictProps, PopupDictState } from "./interface";
import PluginList from "../../../utils/readUtils/pluginList";
import Plugin from "../../../models/Plugin";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import Parser from "html-react-parser";
import * as DOMPurify from "dompurify";
import axios from "axios";
import RecordLocation from "../../../utils/readUtils/recordLocation";
import DictHistory from "../../../models/DictHistory";
import { Trans } from "react-i18next";
import { openExternalUrl } from "../../../utils/serviceUtils/urlUtil";
import lemmatize from "wink-lemmatizer";
import toast from "react-hot-toast";
declare var window: any;
class PopupDict extends React.Component<PopupDictProps, PopupDictState> {
  constructor(props: PopupDictProps) {
    super(props);
    this.state = {
      dictText: this.props.t("Please wait"),
      word: "",
      prototype: "",
      dictService: StorageUtil.getReaderConfig("dictService"),
      dictTarget: StorageUtil.getReaderConfig("dictTarget") || "en",
      isAddNew: false,
    };
  }
  componentDidMount() {
    this.handleLookUp();
  }
  handleLookUp() {
    let originalText = this.props.originalText
      .replace(/(\r\n|\n|\r)/gm, "")
      .replace(/-/gm, "");
    this.setState({ word: originalText });
    let prototype = "";
    prototype = lemmatize.verb(originalText);
    prototype = lemmatize.noun(prototype);
    prototype = lemmatize.adjective(prototype);
    this.setState({ prototype });
    if (StorageUtil.getReaderConfig("isLemmatizeWord") === "yes") {
      originalText = prototype;
    }
    if (
      !this.state.dictService ||
      PluginList.getAllPlugins().findIndex(
        (item) => item.identifier === this.state.dictService
      ) === -1
    ) {
      this.setState({ isAddNew: true });
    }
    this.handleDict(originalText);
    this.handleRecordHistory(originalText);
  }
  handleRecordHistory = async (text: string) => {
    let bookKey = this.props.currentBook.key;
    let bookLocation = RecordLocation.getHtmlLocation(bookKey);
    let chapter = bookLocation.chapterTitle;
    let word = new DictHistory(bookKey, text, chapter);
    let dictHistoryArr = (await window.localforage.getItem("words")) || [];
    dictHistoryArr.push(word);
    window.localforage.setItem("words", dictHistoryArr);
  };
  handleDict = async (text: string) => {
    try {
      let plugin = PluginList.getPluginById(this.state.dictService);
      let dictFunc = plugin.script;
      // eslint-disable-next-line no-eval
      eval(dictFunc);
      let dictText = await window.getDictText(
        text,
        "auto",
        this.state.dictTarget,
        axios,
        this.props.t,
        plugin.config
      );
      if (dictText.startsWith("https://")) {
        window.open(dictText);
      } else {
        this.setState(
          {
            dictText: dictText,
          },
          () => {
            let moreElement = document.querySelector(".dict-learn-more");
            if (moreElement) {
              moreElement.addEventListener("click", () => {
                openExternalUrl(window.learnMoreUrl);
              });
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
      this.setState({
        dictText: this.props.t("Error happened"),
      });
    }
  };
  handleChangeDictService = (dictService: string) => {
    this.setState(
      {
        dictService: dictService,
        isAddNew: false,
      },
      () => {
        StorageUtil.setReaderConfig("dictService", dictService);
        this.setState(
          {
            dictTarget: "en",
          },
          () => {
            StorageUtil.setReaderConfig("dictTarget", "en");
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
                  this.setState({ isAddNew: true });
                  return;
                }
                this.handleChangeDictService(event.target.value);
              }}
            >
              {PluginList.getAllPlugins()
                .filter((item) => item.type === "dictionary")
                .map((item, index) => {
                  return (
                    <option
                      value={item.identifier}
                      key={item.identifier}
                      className="add-dialog-shelf-list-option"
                      selected={
                        this.state.dictService === item.identifier
                          ? true
                          : false
                      }
                    >
                      {item.displayName}
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
                    StorageUtil.setReaderConfig(
                      "dictTarget",
                      event.target.value
                    );
                    this.handleLookUp();
                  }
                );
              }}
            >
              {PluginList.getPluginById(this.state.dictService).langList &&
                (
                  PluginList.getPluginById(this.state.dictService)
                    .langList as any[]
                ).map((item, index) => {
                  return (
                    <option
                      value={item.code}
                      key={item.code}
                      className="add-dialog-shelf-list-option"
                      selected={
                        this.state.dictTarget === item.code ? true : false
                      }
                    >
                      {item["nativeLang"]}
                    </option>
                  );
                })}
            </select>
          </div>
          <div className="dict-word">
            {StorageUtil.getReaderConfig("isLemmatizeWord") === "yes"
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
              className="trans-add-new-container"
              style={{ fontWeight: 500 }}
            >
              <textarea
                name="url"
                placeholder={this.props.t(
                  "Paste the code of the plugin here, check out document to learn how to get more plugin"
                )}
                id="trans-add-content-box"
                className="trans-add-content-box"
              />
              <div className="trans-add-button-container">
                <div
                  className="trans-add-cancel"
                  style={{ color: "#2084e8" }}
                  onClick={() => {
                    if (
                      StorageUtil.getReaderConfig("lang") === "zhCN" ||
                      StorageUtil.getReaderConfig("lang") === "zhTW" ||
                      StorageUtil.getReaderConfig("lang") === "zhMO"
                    ) {
                      openExternalUrl("https://www.koodoreader.com/zh/plugin");
                    } else {
                      openExternalUrl("https://www.koodoreader.com/en/plugin");
                    }
                  }}
                >
                  <Trans>Document</Trans>
                </div>
                <div
                  className="trans-add-cancel"
                  onClick={() => {
                    this.setState({ isAddNew: false });
                  }}
                >
                  <Trans>Cancel</Trans>
                </div>
                <div
                  className="trans-add-comfirm"
                  style={{ backgroundColor: "#2084e8" }}
                  onClick={() => {
                    let value: string = (
                      document.querySelector(
                        "#trans-add-content-box"
                      ) as HTMLTextAreaElement
                    ).value;
                    if (value) {
                      let plugin: Plugin = JSON.parse(value);

                      let isSuccess = PluginList.addPlugin(plugin);
                      if (!isSuccess) {
                        toast.error(this.props.t("Plugin verification failed"));
                        return;
                      }
                      this.setState({ dictService: plugin.identifier });
                      toast.success(this.props.t("Addition successful"));
                      this.handleChangeDictService(plugin.identifier);
                    }
                    this.setState({ isAddNew: false });
                  }}
                >
                  <Trans>Confirm</Trans>
                </div>
              </div>
            </div>
          )}
          {!this.state.isAddNew && (
            <div className="dict-text-box">
              {Parser(
                DOMPurify.sanitize(
                  this.state.dictText + "<address></address>"
                ) || " ",
                {
                  replace: (domNode) => {},
                }
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
