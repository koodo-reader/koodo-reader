import React from "react";
import "./popupTrans.css";
import { PopupTransProps, PopupTransState } from "./interface";
import { googleTransList, edgeTransList } from "../../../constants/transList";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import { bingTranslate } from "../../../utils/serviceUtils/bingTransUtil";
import { googleTranslate } from "../../../utils/serviceUtils/googleTransUtil";
class PopupTrans extends React.Component<PopupTransProps, PopupTransState> {
  constructor(props: PopupTransProps) {
    super(props);
    this.state = {
      translatedText: "",
      originalText: "",
      transService: StorageUtil.getReaderConfig("transService") || "Google",
      transTarget: StorageUtil.getReaderConfig("transTarget"),
      transSource: StorageUtil.getReaderConfig("transSource"),
    };
  }
  componentDidMount() {
    let originalText = this.props.originalText.replace(/(\r\n|\n|\r)/gm, "");
    this.setState({ originalText: originalText });
    this.handleTrans(originalText);
  }
  handleTrans = (text: string) => {
    if (this.state.transService === "Bing") {
      bingTranslate(
        text,
        StorageUtil.getReaderConfig("transSource") || "",
        StorageUtil.getReaderConfig("transTarget") || "en"
      )
        .then((res) => {
          this.setState({
            translatedText: res,
          });
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      googleTranslate(
        text,
        StorageUtil.getReaderConfig("transSource") || "",
        StorageUtil.getReaderConfig("transTarget") || "en"
      )
        .then((res) => {
          if (res.explanations) {
            this.setState({
              translatedText: res.explanations[0].explains[0],
            });
          } else {
            this.setState({
              translatedText: res,
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
  handleChangeService(target: string) {
    this.setState({ transService: target }, () => {
      StorageUtil.setReaderConfig("transService", target);
      let autoValue = target === "Google" || target === "Deepl" ? "auto" : "";
      this.setState({ transSource: autoValue, transTarget: "en" }, () => {
        StorageUtil.setReaderConfig("transTarget", "en");
        StorageUtil.setReaderConfig("transSource", autoValue);
        this.handleTrans(this.props.originalText.replace(/(\r\n|\n|\r)/gm, ""));
      });
    });
  }
  render() {
    const renderNoteEditor = () => {
      return (
        <div className="trans-container">
          <div className="trans-service-selector-container">
            <div
              className={
                this.state.transService === "Google"
                  ? "trans-service-selector"
                  : "trans-service-selector-inactive"
              }
              style={{ width: "90px" }}
              onClick={() => {
                this.handleChangeService("Google");
              }}
            >
              <span className="icon-google trans-google-icon"></span>
              Google
            </div>
            <div
              className={
                this.state.transService === "Bing"
                  ? "trans-service-selector"
                  : "trans-service-selector-inactive"
              }
              onClick={() => {
                this.handleChangeService("Bing");
              }}
            >
              <span className="icon-bing trans-bing-icon"></span>
              Bing
            </div>
          </div>
          <div className="trans-lang-selector-container">
            <div className="original-lang-box">
              <select
                className="original-lang-selector"
                style={{ maxWidth: "120px", margin: 0 }}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                  let targetLang = event.target.value;
                  StorageUtil.setReaderConfig("transSource", targetLang);
                  this.handleTrans(
                    this.props.originalText.replace(/(\r\n|\n|\r)/gm, "")
                  );
                }}
              >
                {(this.state.transService === "Google"
                  ? Object.keys(googleTransList)
                  : Object.keys(edgeTransList)
                ).map((item, index) => {
                  return (
                    <option
                      value={item}
                      key={index}
                      className="add-dialog-shelf-list-option"
                      selected={
                        StorageUtil.getReaderConfig("transSource") === item
                          ? true
                          : false
                      }
                    >
                      {
                        (this.state.transService === "Google"
                          ? Object.values(googleTransList)
                          : Object.values(edgeTransList))[index]
                      }
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="trans-lang-box">
              <select
                className="trans-lang-selector"
                style={{ maxWidth: "120px", margin: 0 }}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                  let targetLang = event.target.value;
                  StorageUtil.setReaderConfig("transTarget", targetLang);
                  this.handleTrans(
                    this.props.originalText.replace(/(\r\n|\n|\r)/gm, "")
                  );
                }}
              >
                {(this.state.transService === "Google"
                  ? Object.keys(googleTransList)
                  : Object.keys(edgeTransList)
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
                        (this.state.transService === "Google"
                          ? Object.values(googleTransList)
                          : Object.values(edgeTransList))[index]
                      }
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="trans-box">
            <div className="original-text-box">
              <div className="original-text">{this.state.originalText}</div>
            </div>
            <div className="trans-text-box">
              <div className="trans-text">{this.state.translatedText}</div>
            </div>
          </div>

          {/* <div className="target-lang-container">
            

            <div>{"->"}</div>
          </div> */}
        </div>
      );
    };
    return renderNoteEditor();
  }
}
export default PopupTrans;
