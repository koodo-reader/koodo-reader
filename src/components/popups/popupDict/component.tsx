import React from "react";
import "./popupDict.css";
import { PopupDictProps, PopupDictState } from "./interface";
import {
  bingLangList,
  dictList,
  freeLangList,
  googleLangList,
} from "../../../constants/dictList";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import Parser from "html-react-parser";
import * as DOMPurify from "dompurify";
import axios from "axios";
import RecordLocation from "../../../utils/readUtils/recordLocation";
import DictHistory from "../../../model/DictHistory";
import { Trans } from "react-i18next";
import { wikiList } from "../../../constants/dictList";
import { googleTranslate } from "../../../utils/serviceUtils/googleTransUtil";
import { getBingDict } from "../../../utils/serviceUtils/bingDictUtil";
import { openExternalUrl } from "../../../utils/serviceUtils/urlUtil";
import lemmatize from "wink-lemmatizer";
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
  handleDictText = (res: any) => {
    return (
      `<p class="dict-word-type">[${this.props.t("Pronunciations")}]</p></p>` +
      res.pronunciations
        .map((item) => {
          return `<span style="font-weight: bold">${
            item.region ? item.region : ""
          }</span> [${item.symbol}]`;
        })
        .join(" ") +
      res.audios.map((item) => {
        return `<br/><div class="audio-container"><audio controls class="audio-player" controlsList="nodownload noplaybackrate"><source src="${item.url}" type="audio/mpeg"></audio></div></p>`;
      }) +
      `<p class="dict-word-type">[${this.props.t("Explanations")}]</p>` +
      res.explanations
        .map((item) => {
          return `<p><span style="font-weight: bold">${
            item.trait
          }</span> ${item.explains.join(", ")}</p>`;
        })
        .join("") +
      `<p class="dict-word-type">[${this.props.t("Associations")}]</p></p>` +
      res.associations
        .map((item) => {
          return item;
        })
        .join(", ") +
      `<p class="dict-word-type">[${this.props.t("Sentence")}]</p><ul>` +
      res.sentence
        .map(
          (item) =>
            `<li>${item.source}${
              item.translation ? " " + item.translation : ""
            }</li>`
        )
        .join("") +
      "</ul>" +
      `<p class="dict-learn-more">${this.props.t("Learn more")}</p>`
    );
  };
  handleDict = async (text: string) => {
    if (StorageUtil.getReaderConfig("dictService") === "bing_dict") {
      try {
        let target = await getBingDict(text);

        if (!target.explanations) {
          this.setState({
            dictText: this.props.t("Error happened"),
          });
          return;
        }
        let dictText = this.handleDictText(target);
        this.setState(
          {
            dictText: dictText,
          },
          () => {
            let moreElement = document.querySelector(".dict-learn-more");
            if (moreElement) {
              moreElement.addEventListener("click", () => {
                openExternalUrl("https://www.bing.com/dict/search?q=" + text);
              });
            }
          }
        );
      } catch (error) {
        console.log(error);
        this.setState({
          dictText: this.props.t("Error happened"),
        });
      }
    } else if (StorageUtil.getReaderConfig("dictService") === "google_dict") {
      googleTranslate(text, "auto", this.state.dictTarget || "en")
        .then((res) => {
          if (res.explanations) {
            let dictText = this.handleDictText(res);
            this.setState(
              {
                dictText: dictText,
              },
              () => {
                let moreElement = document.querySelector(".dict-learn-more");
                if (moreElement) {
                  moreElement.addEventListener("click", () => {
                    openExternalUrl(
                      "https://www.google.com/search?q=define+" + text
                    );
                  });
                }
              }
            );
          } else {
            this.setState({
              dictText: `<p>${res}</p>`,
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
      return;
    } else if (StorageUtil.getReaderConfig("dictService") === "wikipedia") {
      text = decodeURIComponent(encodeURIComponent(text));
      try {
        const res = await axios.get(
          `https://${this.state.dictTarget}.wikipedia.org/api/rest_v1/page/summary/${text}`
        );
        let html = `<img class="wiki-image" style="shape-outside: url('${
          res.data.originalimage ? res.data.originalimage.source : ""
        }')" src="${
          res.data.originalimage ? res.data.originalimage.source : ""
        }"></img><p class="wiki-text">${
          this.state.dictTarget === "zh"
            ? StorageUtil.getReaderConfig("lang") === "zhMO" ||
              StorageUtil.getReaderConfig("lang") === "zhTW"
              ? window.ChineseS2T.s2t(res.data.extract)
              : window.ChineseS2T.t2s(res.data.extract)
            : res.data.extract
        }</p><p class="dict-learn-more">${this.props.t("Learn more")}</p>`;
        this.setState(
          {
            dictText: html,
          },
          () => {
            let moreElement = document.querySelector(".dict-learn-more");
            if (moreElement) {
              moreElement.addEventListener("click", () => {
                openExternalUrl(
                  "https://" +
                    this.state.dictTarget +
                    ".wikipedia.org/w/index.php?search=" +
                    text
                );
              });
            }
          }
        );
      } catch (error) {
        console.log(error);
        this.setState({
          dictText: this.props.t("Error happened"),
        });
      }
    } else {
      axios
        .get(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`)
        .then((res: any) => {
          let dictText =
            `<p class="dict-word-type">[${this.props.t(
              "Pronunciations"
            )}]</p></p>` +
            (res.data[0].phonetic ? res.data[0].phonetic : "") +
            `<br/>` +
            res.data[0].phonetics
              .filter((item) => item.audio)
              .map((item) => {
                return (
                  `<span class='audio-label'>${
                    item.audio.includes("uk") ? "UK" : "US"
                  } </span>` +
                  `<span class='audio-note'>${
                    item.text ? item.text : ""
                  } </span>` +
                  `<div class="audio-container"><audio controls class="audio-player" controlsList="nodownload noplaybackrate"><source src="${item.audio}" type="audio/mpeg"></audio></div>`
                );
              })
              .join("") +
            res.data[0].meanings
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
              .join("") +
            `<p class="dict-learn-more">${this.props.t("Learn more")}</p>`;
          this.setState(
            {
              dictText: dictText,
            },
            () => {
              let moreElement = document.querySelector(".dict-learn-more");
              if (moreElement) {
                moreElement.addEventListener("click", () => {
                  openExternalUrl(res.data[0].sourceUrls[0]);
                });
              }
            }
          );
        })
        .catch((err) => {
          console.log(err);
          this.setState({
            dictText: this.props.t("Error happened"),
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
                        dictTarget: "en",
                      },
                      () => {
                        StorageUtil.setReaderConfig("dictTarget", "en");
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
              {(this.state.dictService === "wikipedia"
                ? wikiList
                : this.state.dictService === "bing_dict"
                ? bingLangList
                : this.state.dictService === "google_dict"
                ? googleLangList
                : freeLangList
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
                    {
                      item[
                        this.state.dictService !== "google_dict"
                          ? "nativeLang"
                          : "lang"
                      ]
                    }
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
