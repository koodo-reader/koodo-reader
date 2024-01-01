import React from "react";
import "./popupDict.css";
import { PopupDictProps, PopupDictState } from "./interface";
import { dictList } from "../../../constants/dictList";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import Parser from "html-react-parser";
import * as DOMPurify from "dompurify";
import axios from "axios";
import { getBingDict } from "../../../utils/serviceUtils/bingDictUtil";
import RecordLocation from "../../../utils/readUtils/recordLocation";
import DictHistory from "../../../model/DictHistory";
import { Trans } from "react-i18next";
import { wikiList } from "../../../constants/wikiList";

declare var window: any;
class PopupDict extends React.Component<PopupDictProps, PopupDictState> {
  constructor(props: PopupDictProps) {
    super(props);
    this.state = {
      dictText: "Please Wait a moment",
      word: "",
      prototype: "",
      dictService: StorageUtil.getReaderConfig("dictService"),
      dictTarget: StorageUtil.getReaderConfig("dictTarget"),
      wikiCode: StorageUtil.getReaderConfig("wikiCode") || "en",
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
    var lemmatize = window.require("wink-lemmatizer");
    prototype = lemmatize.verb(originalText);
    prototype = lemmatize.noun(prototype);
    prototype = lemmatize.adjective(prototype);
    this.setState({ prototype });
    if (StorageUtil.getReaderConfig("isLemmatizeWord") === "yes") {
      originalText = prototype;
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
    if (StorageUtil.getReaderConfig("dictService") === "bing_cn_dict") {
      const { ipcRenderer } = window.require("electron");
      const html = await ipcRenderer.invoke("get-url-content", {
        url: `https://cn.bing.com/dict/search?mkt=zh-cn&q=${encodeURIComponent(
          text
        )}`,
      });
      if (html) {
        let res: any = await getBingDict(html);
        if (res === "error") {
          this.setState({
            dictText: this.props.t("Error happens"),
          });
          return;
        }
        let dictText = Object.keys(res)
          .filter((item) => item !== "result")
          .map((item) => {
            if (res[item]) {
              return `<p><p class="dict-word-type">[${item}]</p> ${res[item]}</p>`;
            } else {
              return "";
            }
          })
          .join("");
        this.setState({
          dictText: dictText,
        });
      } else {
        this.setState({
          dictText: this.props.t("Error happens"),
        });
      }
    } else if (StorageUtil.getReaderConfig("dictService") === "google_dict") {
      const { ipcRenderer } = window.require("electron");
      const html = await ipcRenderer.invoke("get-url-content", {
        url: `https://www.google.com/search?q=define+${encodeURIComponent(
          text
        )}`,
      });
      if (html) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const parentElement = Array.from(doc.querySelectorAll(".kCrYT"))[1];
        var aNodes = parentElement.querySelectorAll("a");
        if (aNodes.length > 0) {
          this.setState({
            dictText: this.props.t("Error happens"),
          });
          return;
        }
        var childElements = parentElement.querySelectorAll(".r0bn4c");
        // 遍历子元素并移除特定的子元素
        for (var i = 0; i < childElements.length; i++) {
          var childElement = childElements[i];
          if (
            childElement.textContent &&
            (childElement.textContent?.indexOf(":") > -1 ||
              childElement.textContent?.indexOf('"') > -1 ||
              childElement.textContent?.indexOf("「") > -1)
          ) {
            childElement.parentNode &&
              childElement.parentNode.removeChild(childElement);
          }
          if (childElement.textContent) {
            childElement.textContent = childElement.textContent.trim();
          }
        }
        this.setState({
          dictText: parentElement.innerHTML,
        });
      } else {
        this.setState({
          dictText: this.props.t("Error happens"),
        });
      }
    } else if (StorageUtil.getReaderConfig("dictService") === "google_dict") {
      const { ipcRenderer } = window.require("electron");
      const html = await ipcRenderer.invoke("get-url-content", {
        url: `https://www.google.com/search?q=define+${encodeURIComponent(
          text
        )}`,
      });
      if (html) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const parentElement = Array.from(doc.querySelectorAll(".kCrYT"))[1];
        var aNodes = parentElement.querySelectorAll("a");
        if (aNodes.length > 0) {
          this.setState({
            dictText: this.props.t("Error happens"),
          });
          return;
        }
        var childElements = parentElement.querySelectorAll(".r0bn4c");
        // 遍历子元素并移除特定的子元素
        for (var i = 0; i < childElements.length; i++) {
          var childElement = childElements[i];
          if (
            childElement.textContent &&
            (childElement.textContent?.indexOf(":") > -1 ||
              childElement.textContent?.indexOf('"') > -1 ||
              childElement.textContent?.indexOf("「") > -1)
          ) {
            childElement.parentNode &&
              childElement.parentNode.removeChild(childElement);
          }
          if (childElement.textContent) {
            childElement.textContent = childElement.textContent.trim();
          }
        }
        this.setState({
          dictText: parentElement.innerHTML,
        });
      } else {
        this.setState({
          dictText: this.props.t("Error happens"),
        });
      }
    } else if (StorageUtil.getReaderConfig("dictService") === "wikipedia") {
      const { ipcRenderer } = window.require("electron");

      const res = await ipcRenderer.invoke("wiki-index", {
        text,
        code: this.state.wikiCode,
      });
      if (res) {
        let html = `<img class="wiki-image" style="shape-outside: url('${
          res.image
        }')" src="${res.image}"></img><p class="wiki-text">${
          this.state.wikiCode === "zh"
            ? StorageUtil.getReaderConfig("lang") === "zhMO" ||
              StorageUtil.getReaderConfig("lang") === "zhTW"
              ? window.ChineseS2T.s2t(res.summary)
              : window.ChineseS2T.t2s(res.summary)
            : res.summary
        }</p>`;
        this.setState({
          dictText: html,
        });
      } else {
        this.setState({
          dictText: this.props.t("Error happens"),
        });
      }
    } else {
      axios
        .get(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`)
        .then((res: any) => {
          let dictText = res.data[0].meanings
            .map((item) => {
              return `<p><p class="dict-word-type">[${
                item.partOfSpeech
              }]</p><div>${item.definitions
                .map((item, index) => {
                  return (
                    `<span style="font-weight: bold">${index + 1}</span>` +
                    ". " +
                    item.definition
                  );
                })
                .join("</div><div>")}</div></p>`;
            })
            .join("");
          this.setState({
            dictText: dictText,
          });
        })
        .catch((err) => {
          this.setState({
            dictText: this.props.t("Error happens"),
          });
        });
    }
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
                this.setState(
                  {
                    dictService: event.target.value,
                  },
                  () => {
                    StorageUtil.setReaderConfig(
                      "dictService",
                      event.target.value
                    );
                    this.setState(
                      {
                        dictTarget: "en-en",
                      },
                      () => {
                        StorageUtil.setReaderConfig("dictTarget", "en-en");
                        this.handleLookUp();
                      }
                    );
                  }
                );
              }}
            >
              {dictList.map((item, index) => {
                return (
                  <option
                    value={item.name}
                    key={item.name}
                    className="add-dialog-shelf-list-option"
                    selected={
                      this.state.dictService === item.name ? true : false
                    }
                  >
                    {item.title}
                  </option>
                );
              })}
            </select>
          </div>
          {this.state.dictService === "wikipedia" ? (
            <div className="dict-service-container" style={{ right: 150 }}>
              <select
                className="dict-service-selector"
                style={{ margin: 0 }}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                  this.setState(
                    {
                      wikiCode: event.target.value,
                    },
                    () => {
                      StorageUtil.setReaderConfig(
                        "wikiCode",
                        event.target.value
                      );
                      this.handleLookUp();
                    }
                  );
                }}
              >
                {wikiList.map((item, index) => {
                  return (
                    <option
                      value={item.code}
                      key={item.code}
                      className="add-dialog-shelf-list-option"
                      selected={
                        this.state.wikiCode === item.code ? true : false
                      }
                    >
                      {item.nativeLang}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : null}

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

          <div className="dict-text-box">
            {Parser(
              DOMPurify.sanitize(this.state.dictText + "<address></address>") ||
                " ",
              {
                replace: (domNode) => {},
              }
            )}
          </div>
        </div>
      );
    };
    return renderDictBox();
  }
}
export default PopupDict;
