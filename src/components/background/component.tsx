import React from "react";
import "./background.css";
import { BackgroundProps, BackgroundState } from "./interface";
import StorageUtil from "../../utils/serviceUtils/storageUtil";

class Background extends React.Component<BackgroundProps, BackgroundState> {
  isFirst: Boolean;
  constructor(props: any) {
    super(props);
    this.state = {
      isSingle:
        StorageUtil.getReaderConfig("readerMode") &&
        StorageUtil.getReaderConfig("readerMode") !== "double",
      scale: StorageUtil.getReaderConfig("scale") || 1,
    };
    this.isFirst = true;
  }
  componentDidMount() {
    let background = document.querySelector(".background");
    if (!background) return;
    background?.setAttribute(
      "style",
      `background-color:${
        StorageUtil.getReaderConfig("backgroundColor")
          ? StorageUtil.getReaderConfig("backgroundColor")
          : StorageUtil.getReaderConfig("appSkin") === "night" ||
            (StorageUtil.getReaderConfig("appSkin") === "system" &&
              StorageUtil.getReaderConfig("isOSNight") === "yes")
          ? "rgba(44,47,49,1)"
          : "rgba(255,255,255,1)"
      };filter: brightness(${
        StorageUtil.getReaderConfig("brightness") || 1
      }) invert(${StorageUtil.getReaderConfig("isInvert") === "yes" ? 1 : 0})`
    );
  }

  render() {
    return (
      <>
        
      </>
    );
  }
}

export default Background;
