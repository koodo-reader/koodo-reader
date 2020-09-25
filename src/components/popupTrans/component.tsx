//翻译弹窗
import React from "react";
import "./popupTrans.css";
import { PopupTransProps, PopupTransState } from "./interface";
import OtherUtil from "../../utils/otherUtil";
import md5 from "md5";

class PopupTrans extends React.Component<PopupTransProps, PopupTransState> {
  constructor(props: PopupTransProps) {
    super(props);
    this.state = {
      translatedText: "",
    };
  }
  componentDidMount() {
    let lng = OtherUtil.getReaderConfig("lang");
    //兼容之前的版本
    if (lng === "cn") {
      lng = "zh";
    }
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://fanyi-api.baidu.com/api/trans/vip/translate?q=${
      this.props.originalText
    }&from=auto&to=${
      lng || "zh"
    }&appid=20200802000531425&salt=1435660288&sign=${md5(
      "20200802000531425" +
        this.props.originalText +
        "1435660288" +
        "sJRHTorJq8j8_ru2GkHl"
    )}&callback=handleCallback`;
    document.head.appendChild(script);
    (window as any).handleCallback = (res: any) => {
      this.setState({
        translatedText: res.trans_result ? res.trans_result[0].dst : "出错了",
      });
    };
  }

  render() {
    const renderNoteEditor = () => {
      return (
        <div className="trans-container">
          <div className="original-text-box">{this.props.originalText}</div>
          <div className="trans-text-box">{this.state.translatedText}</div>
        </div>
      );
    };
    return renderNoteEditor();
  }
}
export default PopupTrans;
