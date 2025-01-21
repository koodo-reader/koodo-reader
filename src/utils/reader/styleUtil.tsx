import { getIframeDoc } from "./docUtil";
import ConfigService from "../storage/configService";

class styleUtil {
  // add default css for iframe
  static addDefaultCss() {
    let doc = getIframeDoc();
    if (!doc) return;
    let background = document.querySelector(".viewer");
    if (!background) return;
    background.setAttribute(
      "style",
      `background-color:${
        ConfigService.getReaderConfig("isMergeWord") === "yes"
          ? "rgba(0,0,0,0)"
          : ConfigService.getReaderConfig("backgroundColor") ||
            "rgba(255,255,255,1)"
      };filter: brightness(${
        ConfigService.getReaderConfig("brightness") || 1
      }) invert(${ConfigService.getReaderConfig("isInvert") === "yes" ? 1 : 0})`
    );
    if (!doc.head) {
      return;
    }
    //get style with id of default-style
    let styleElement = doc.getElementById("default-style");
    if (styleElement) {
      styleElement.textContent = this.getDefaultCss();
      return;
    } else {
      let css = this.getDefaultCss();
      let style = doc.createElement("style");
      style.id = "default-style";
      style.textContent = css;
      doc.head.appendChild(style);
    }
  }
  // get default css for iframe
  static getDefaultCss() {
    return `::selection{background:#f3a6a68c}::-moz-selection{background:#f3a6a68c}.kookit-note:hover{cursor:pointer;}.kookit-text{${this.getCustomCss()}}code,pre{white-space: pre-wrap;}`;
  }
  //force horionztal writing mode
  static getCustomCss() {
    return `font-size: ${
      ConfigService.getReaderConfig("fontSize") || 17
    }px !important;line-height: ${
      ConfigService.getReaderConfig("lineHeight") || "1.25"
    } !important;font-family: ${
      ConfigService.getReaderConfig("fontFamily") || ""
    } !important;background-color: transparent;color: ${
      ConfigService.getReaderConfig("textColor")
        ? ConfigService.getReaderConfig("textColor")
        : ConfigService.getReaderConfig("backgroundColor") ===
            "rgba(44,47,49,1)" ||
          ConfigService.getReaderConfig("appSkin") === "night" ||
          (ConfigService.getReaderConfig("appSkin") === "system" &&
            ConfigService.getReaderConfig("isOSNight") === "yes")
        ? "white"
        : ""
    } !important;letter-spacing: ${
      ConfigService.getReaderConfig("letterSpacing")
        ? ConfigService.getReaderConfig("letterSpacing")
        : ""
    }px !important;text-align: ${
      ConfigService.getReaderConfig("textAlign")
        ? ConfigService.getReaderConfig("textAlign")
        : ""
    } !important;
      font-weight: ${
        ConfigService.getReaderConfig("isBold") === "yes"
          ? "bold !important"
          : ""
      };font-style: ${
      ConfigService.getReaderConfig("isItalic") === "yes"
        ? "italic !important"
        : ""
    };text-shadow: ${
      ConfigService.getReaderConfig("isShadow") === "yes"
        ? "2px 2px 2px #cccccc !important"
        : ""
    };text-indent: ${
      ConfigService.getReaderConfig("isIndent") === "yes" ? "2rem" : ""
    };text-decoration: ${
      ConfigService.getReaderConfig("isUnderline") === "yes"
        ? "underline !important"
        : ""
    };margin-bottom: ${
      ConfigService.getReaderConfig("paraSpacing") || 0
    }px !important;padding:0px !important;word-wrap: break-word !important; writing-mode: horizontal-tb !important;`;
  }
  static addStyle = (url: string) => {
    const style = document.createElement("link");
    style.href = url;
    style.rel = "stylesheet";
    document.head.appendChild(style);
  };

  static applyTheme() {
    ConfigService.getReaderConfig("themeColor") &&
      ConfigService.getReaderConfig("themeColor") !== "default" &&
      this.addStyle(
        "./assets/styles/" +
          ConfigService.getReaderConfig("themeColor") +
          ".css"
      );
  }
}

export default styleUtil;
