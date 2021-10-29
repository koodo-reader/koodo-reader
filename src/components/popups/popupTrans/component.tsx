import React from "react";
import "./popupTrans.css";
import { PopupTransProps, PopupTransState } from "./interface";
import md5 from "md5";
import { Trans } from "react-i18next";
import { translationList } from "../../../constants/translationList";
import StorageUtil from "../../../utils/storageUtil";

class PopupTrans extends React.Component<PopupTransProps, PopupTransState> {
  constructor(props: PopupTransProps) {
    super(props);
    this.state = {
      translatedText: "",
    };
  }
  componentDidMount() {
    let originalText = this.props.originalText.replace(/(\r\n|\n|\r)/gm, "");
    this.handleTrans(originalText);
  }
  handleTrans = (text: string) => {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://fanyi-api.baidu.com/api/trans/vip/translate?q=${text}&from=auto&to=${
      StorageUtil.getReaderConfig("transTarget") || "auto"
    }&appid=20200802000531425&salt=1435660288&sign=${md5(
      // eslint-disable-next-line
      "20200802000531425" + text + "1435660288" + "sJRHTorJq8j8_ru2GkHl"
    )}&callback=handleCallback`;
    document.head.appendChild(script);
    (window as any).handleCallback = (res: any) => {
      if (res.error_code && res.error_code === 54003) {
        this.setState({
          translatedText: this.props.t("Reach frequency limit"),
        });
      } else {
        this.setState({
          translatedText: res.trans_result
            ? res.trans_result[0].dst
            : this.props.t("Error happens"),
        });
      }
    };
  };
  render() {
    const renderNoteEditor = () => {
      return (
        <div className="trans-container">
          <div className="trans-text-box">{this.state.translatedText}</div>
          <div className="target-lang-container">
            <p className="general-setting-title" style={{ display: "inline" }}>
              <Trans>Target</Trans>
            </p>
            <select
              className="booklist-shelf-list"
              style={{ width: "100px" }}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                let targetLang = event.target.value;
                StorageUtil.setReaderConfig("transTarget", targetLang);
                this.handleTrans(
                  this.props.originalText.replace(/(\r\n|\n|\r)/gm, "")
                );
              }}
            >
              {translationList.map((item, index) => {
                return (
                  <option
                    value={item.value}
                    key={index}
                    className="add-dialog-shelf-list-option"
                    selected={
                      StorageUtil.getReaderConfig("transTarget") === item.value
                        ? true
                        : false
                    }
                  >
                    {item.name}
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
