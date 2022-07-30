import React from "react";
import "./popupTrans.css";
import { PopupTransProps, PopupTransState } from "./interface";
import { Trans } from "react-i18next";
import {
  googleTransList,
  bingTransList,
} from "../../../constants/translationList";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
class PopupTrans extends React.Component<PopupTransProps, PopupTransState> {
  constructor(props: PopupTransProps) {
    super(props);
    this.state = {
      translatedText: "",
      translateService: "Google",
    };
  }
  componentDidMount() {
    let originalText = this.props.originalText.replace(/(\r\n|\n|\r)/gm, "");
    this.handleTrans(originalText);
  }
  handleTrans = (text: string) => {
    if (StorageUtil.getReaderConfig("transService") === "Bing") {
      const { translate } = window.require("bing-translate-api");
      translate(
        text,
        null,
        StorageUtil.getReaderConfig("transTarget") || "en",
        false
      )
        .then((res) => {
          this.setState({
            translatedText: res.translation,
          });
        })
        .catch((err) => {
          console.error(err);
          this.setState({
            translatedText: this.props.t("Error happens"),
          });
        });
    } else {
      const translate = window.require("@vitalets/google-translate-api");
      translate(text, {
        to: StorageUtil.getReaderConfig("transTarget") || "en",
        tld: navigator.language === "zh-CN" ? "cn" : "com",
      })
        .then((res) => {
          this.setState({
            translatedText: res.text,
          });
        })
        .catch((err) => {
          console.log(err);
          this.setState({
            translatedText: this.props.t("Error happens"),
          });
        });
    }
  };
  render() {
    const renderNoteEditor = () => {
      return (
        <div className="trans-container">
          <div className="trans-text-box">{this.state.translatedText}</div>
          <div className="target-lang-container">
            <p className="general-setting-title" style={{ display: "inline" }}>
              <Trans>Select</Trans>
            </p>
            <select
              className="booklist-shelf-list"
              style={{ width: "80px", marginLeft: "10px" }}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                StorageUtil.setReaderConfig("transService", event.target.value);
                this.setState({ translateService: event.target.value });
                this.handleTrans(
                  this.props.originalText.replace(/(\r\n|\n|\r)/gm, "")
                );
              }}
            >
              {["Google", "Bing"].map((item, index) => {
                return (
                  <option
                    value={item}
                    key={index}
                    className="add-dialog-shelf-list-option"
                    selected={
                      StorageUtil.getReaderConfig("transService") === item
                        ? true
                        : false
                    }
                  >
                    {item}
                  </option>
                );
              })}
            </select>
            <select
              className="booklist-shelf-list"
              style={{ width: "100px", marginLeft: "10px" }}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                let targetLang = event.target.value;
                StorageUtil.setReaderConfig("transTarget", targetLang);
                this.handleTrans(
                  this.props.originalText.replace(/(\r\n|\n|\r)/gm, "")
                );
              }}
            >
              {(this.state.translateService === "Google"
                ? Object.keys(googleTransList)
                : Object.keys(bingTransList)
              ).map((item, index) => {
                return (
                  <option
                    value={item}
                    key={index}
                    className="add-dialog-shelf-list-option"
                    selected={
                      StorageUtil.getReaderConfig("transTarget") === item
                        ? true
                        : false
                    }
                  >
                    {
                      (this.state.translateService === "Google"
                        ? Object.values(googleTransList)
                        : Object.values(bingTransList))[index]
                    }
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      );
    };
    return renderNoteEditor();
  }
}
export default PopupTrans;
