import React from "react";
import "./popupDict.css";
import { PopupDictProps, PopupDictState } from "./interface";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import Parser from "html-react-parser";
import * as DOMPurify from "dompurify";
import axios from "axios";
import DictHistory from "../../../models/DictHistory";
import { Trans } from "react-i18next";
import { openExternalUrl } from "../../../utils/common";
import toast from "react-hot-toast";
import DatabaseService from "../../../utils/storage/databaseService";
import { checkPlugin } from "../../../utils/common";
declare var window: any;
class PopupDict extends React.Component<PopupDictProps, PopupDictState> {
  constructor(props: PopupDictProps) {
    super(props);
    this.state = {
      dictText: this.props.t("Please wait"),
      word: "",
      prototype: "",
      dictService: ConfigService.getReaderConfig("dictService"),
      dictTarget: ConfigService.getReaderConfig("dictTarget") || "en",
      isAddNew: false,
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
    if (
      !this.state.dictService ||
      this.props.plugins.findIndex(
        (item) => item.key === this.state.dictService
      ) === -1
    ) {
      this.setState({ isAddNew: true });
    }
    this.handleDict(originalText);
    this.handleRecordHistory(originalText);
  }
  handleRecordHistory = async (text: string) => {
    let bookKey = this.props.currentBook.key;
    let bookLocation = ConfigService.getObjectConfig(
      bookKey,
      "recordLocation",
      {}
    );
    let chapter = bookLocation.chapterTitle;
    let word = new DictHistory(bookKey, text, chapter);
    await DatabaseService.saveRecord(word, "words");
  };
  handleDict = async (text: string) => {
    try {
      let plugin = this.props.plugins.find(
        (item) => item.key === this.state.dictService
      );
      if (!plugin) return;
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
        openExternalUrl(dictText, true);
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
                  this.setState({ isAddNew: true });
                  return;
                }
                this.handleChangeDictService(event.target.value);
              }}
            >
              {this.props.plugins
                .filter((item) => item.type === "dictionary")
                .map((item, index) => {
                  return (
                    <option
                      value={item.key}
                      key={item.key}
                      className="add-dialog-shelf-list-option"
                      selected={
                        this.state.dictService === item.key ? true : false
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
              className="trans-add-new-container"
              style={{ fontWeight: 500 }}
            >
              <textarea
                name="url"
                placeholder={this.props.t(
                  "Paste the code of the plugin here, check out document to learn how to get more plugins"
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
                      ConfigService.getReaderConfig("lang") === "zhCN" ||
                      ConfigService.getReaderConfig("lang") === "zhTW" ||
                      ConfigService.getReaderConfig("lang") === "zhMO"
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
                  className="trans-add-confirm"
                  style={{ backgroundColor: "#2084e8" }}
                  onClick={async () => {
                    let value: string = (
                      document.querySelector(
                        "#trans-add-content-box"
                      ) as HTMLTextAreaElement
                    ).value;
                    if (value) {
                      let plugin: any = JSON.parse(value);
                      plugin.key = plugin.identifier;
                      if (!(await checkPlugin(plugin))) {
                        toast.error(this.props.t("Plugin verification failed"));
                        return;
                      }
                      if (
                        this.props.plugins.find(
                          (item) => item.key === plugin.key
                        )
                      ) {
                        await DatabaseService.updateRecord(plugin, "plugins");
                      } else {
                        await DatabaseService.saveRecord(plugin, "plugins");
                      }
                      this.props.handleFetchPlugins();
                      toast.success(this.props.t("Addition successful"));
                    }
                    this.setState({
                      isAddNew: false,
                      dictText: this.props.t("Please select the service"),
                    });
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
