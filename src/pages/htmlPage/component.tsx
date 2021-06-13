//卡片模式下的图书显示
import React from "react";
import { ViewerProps, ViewerState } from "./interface";
import { withRouter } from "react-router-dom";
import OtherUtil from "../../utils/otherUtil";
import RecordLocation from "../../utils/readUtils/recordLocation";
import Viewer from "../../containers/htmlViewer";

class HtmlReader extends React.Component<ViewerProps, ViewerState> {
  constructor(props: ViewerProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    let url = document.location.href.split("/");
    let key = url[url.length - 1].split("?")[0];

    document.documentElement.style.height = "auto";
    document.documentElement.style.overflow = "auto";
    window.addEventListener("wheel", (event) => {
      RecordLocation.recordScrollHeight(
        key,
        document.body.clientWidth,
        document.body.clientHeight,
        document.scrollingElement!.scrollTop
      );
    });

    window.onbeforeunload = () => {
      this.handleExit();
    };
  }
  // 点击退出按钮的处理程序
  handleExit() {
    this.props.handleReadingState(false);

    OtherUtil.setReaderConfig("windowWidth", document.body.clientWidth + "");
    OtherUtil.setReaderConfig("windowHeight", document.body.clientHeight + "");
    OtherUtil.setReaderConfig("windowX", window.screenX + "");
    OtherUtil.setReaderConfig("windowY", window.screenY + "");
  }

  render() {
    return <Viewer />;
  }
}
export default withRouter(HtmlReader as any);
