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
          : StorageUtil.getReaderConfig("backgroundColor")
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
    let colors = ["#FBF1D1", "#EFEEB0", "#CAEFC9", "#76BEE9"];
    let lines = ["#FF0000", "#000080", "#0000FF", "#2EFF2E"];

    return `::selection{background:#f3a6a68c}::-moz-selection{background:#f3a6a68c}[class*=color-]:hover{cursor:pointer;background-image:linear-gradient(0,rgba(0,0,0,.075),rgba(0,0,0,.075))}.color-0{background-color:${colors[0]}}.color-1{background-color:${colors[1]}}.color-2{background-color:${colors[2]}}.color-3{background-color:${colors[3]}}.line-0{border-bottom:2px solid ${lines[0]}}.line-1{border-bottom:2px solid ${lines[1]}}.line-2{border-bottom:2px solid ${lines[2]}}.line-3{border-bottom:2px solid ${lines[3]}}}img{max-width:100% !important}`;
  }
  static getCustomCss(isJSON: boolean = true) {
    if (isJSON) {
      return `font-size: ${
        StorageUtil.getReaderConfig("fontSize") || 17
      }px !important;line-height: ${
        StorageUtil.getReaderConfig("lineHeight") || "1.25"
      } !important;font-family: ${
        StorageUtil.getReaderConfig("fontFamily") || "Helvetica"
      } !important;color: ${
        StorageUtil.getReaderConfig("textColor")
          ? StorageUtil.getReaderConfig("textColor")
          : StorageUtil.getReaderConfig("backgroundColor") ===
              "rgba(44,47,49,1)" ||
            StorageUtil.getReaderConfig("isDisplayDark") === "yes"
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
      }px !important;padding:0;word-wrap: break-word;`;
    } else {
      return {
        "a, article, cite, code, div, li, p, pre, span, table": {
          "font-size": `${
            StorageUtil.getReaderConfig("fontSize") || 17
          }px !important`,
          "line-height": `${
            StorageUtil.getReaderConfig("lineHeight") || "1.25"
          } !important`,
          "font-family": `${
            StorageUtil.getReaderConfig("fontFamily") || ""
          } !important`,
          color: `${
            StorageUtil.getReaderConfig("textColor")
              ? StorageUtil.getReaderConfig("textColor")
              : StorageUtil.getReaderConfig("backgroundColor") ===
                  "rgba(44,47,49,1)" ||
                StorageUtil.getReaderConfig("isDisplayDark") === "yes"
              ? "white"
              : ""
          } !important`,
          "letter-spacing": `${
            StorageUtil.getReaderConfig("letterSpacing")
              ? `${StorageUtil.getReaderConfig("letterSpacing")}px`
              : ""
          } !important`,
          "text-align": `${
            StorageUtil.getReaderConfig("textAlign")
              ? `${StorageUtil.getReaderConfig("textAlign")}`
              : ""
          } !important`,
          "font-weight": `${
            StorageUtil.getReaderConfig("isBold") === "yes"
              ? "bold !important"
              : ""
          }`,
          "text-indent": `${
            StorageUtil.getReaderConfig("isIndent") === "yes" ? "2rem" : ""
          }`,
          "font-style": `${
            StorageUtil.getReaderConfig("isItalic") === "yes"
              ? "italic !important"
              : ""
          }`,
          "text-shadow": `${
            StorageUtil.getReaderConfig("isShadow") === "yes"
              ? "2px 2px 2px #cccccc !important"
              : ""
          }`,
          "text-decoration": `${
            StorageUtil.getReaderConfig("isUnderline") === "yes"
              ? "underline !important"
              : ""
          }`,
          "margin-bottom": `${
            StorageUtil.getReaderConfig("paraSpacing") || 0
          }px !important`,
        },
      };
    }
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
