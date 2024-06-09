import { getIframeDoc } from "../serviceUtils/docUtil";
import StorageUtil from "../serviceUtils/storageUtil";

class styleUtil {
  // 为 iframe 添加默认的样式
  static addDefaultCss() {
    let doc = getIframeDoc();
    if (!doc) return;

    let css = this.getDefaultCss();
    let background = document.querySelector(".viewer");
    if (!background) return;
    background.setAttribute(
      "style",
      `background-color:${
        StorageUtil.getReaderConfig("isMergeWord") === "yes"
          ? "rgba(0,0,0,0)"
          : StorageUtil.getReaderConfig("backgroundColor") ||
            "rgba(255,255,255,1)"
      };filter: brightness(${
        StorageUtil.getReaderConfig("brightness") || 1
      }) invert(${StorageUtil.getReaderConfig("isInvert") === "yes" ? 1 : 0})`
    );
    if (!doc.head) {
      return;
    }

    let style = doc.createElement("style");
    style.id = "default-style";
    style.textContent = css;
    doc.head.appendChild(style);
  }
  // 获取为文档默认应用的css样式
  static getDefaultCss() {
    return `::selection{background:#f3a6a68c}::-moz-selection{background:#f3a6a68c}.kookit-note:hover{cursor:pointer;}img{max-width:100% !important}.kookit-text{${this.getCustomCss()}}code,pre{white-space: pre-wrap;}`;
  }
  //force horionztal writing mode
  static getCustomCss() {
    return `font-size: ${
      StorageUtil.getReaderConfig("fontSize") || 17
    }px !important;line-height: ${
      StorageUtil.getReaderConfig("lineHeight") || "1.25"
    } !important;font-family: ${
      StorageUtil.getReaderConfig("fontFamily") || ""
    } !important;background-color: transparent;color: ${
      StorageUtil.getReaderConfig("textColor")
        ? StorageUtil.getReaderConfig("textColor")
        : StorageUtil.getReaderConfig("backgroundColor") ===
            "rgba(44,47,49,1)" ||
          StorageUtil.getReaderConfig("appSkin") === "night" ||
          (StorageUtil.getReaderConfig("appSkin") === "system" &&
            StorageUtil.getReaderConfig("isOSNight") === "yes")
        ? "white"
        : ""
    } !important;letter-spacing: ${
      StorageUtil.getReaderConfig("letterSpacing")
        ? StorageUtil.getReaderConfig("letterSpacing")
        : ""
    }px !important;text-align: ${
      StorageUtil.getReaderConfig("textAlign")
        ? StorageUtil.getReaderConfig("textAlign")
        : ""
    } !important;
      font-weight: ${
        StorageUtil.getReaderConfig("isBold") === "yes" ? "bold !important" : ""
      };font-style: ${
      StorageUtil.getReaderConfig("isItalic") === "yes"
        ? "italic !important"
        : ""
    };text-shadow: ${
      StorageUtil.getReaderConfig("isShadow") === "yes"
        ? "2px 2px 2px #cccccc !important"
        : ""
    };text-indent: ${
      StorageUtil.getReaderConfig("isIndent") === "yes" ? "2rem" : ""
    };text-decoration: ${
      StorageUtil.getReaderConfig("isUnderline") === "yes"
        ? "underline !important"
        : ""
    };margin-bottom: ${
      StorageUtil.getReaderConfig("paraSpacing") || 0
    }px !important;padding:0px !important;word-wrap: break-word !important; writing-mode: horizontal-tb !important;`;
  }
  static addStyle = (url: string) => {
    const style = document.createElement("link");
    style.href = url;
    style.rel = "stylesheet";
    document.head.appendChild(style);
  };

  static applyTheme() {
    StorageUtil.getReaderConfig("themeColor") &&
      StorageUtil.getReaderConfig("themeColor") !== "default" &&
      this.addStyle(
        "./assets/styles/" + StorageUtil.getReaderConfig("themeColor") + ".css"
      );
  }
}

export default styleUtil;
