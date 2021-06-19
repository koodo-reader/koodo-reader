import OtherUtil from "../otherUtil";

class styleUtil {
  // 为 iframe 添加默认的样式
  static addDefaultCss() {
    let iframe = document.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) return;
    let css = this.getDefaultCss();
    let style = doc.getElementById("default-style");
    let background = document.querySelector(".background");
    if (!background) return;
    background!.setAttribute(
      "style",
      `background-color:${OtherUtil.getReaderConfig(
        "backgroundColor"
      )};filter: brightness(${
        OtherUtil.getReaderConfig("brightness") || 1
      }) invert(${OtherUtil.getReaderConfig("isInvert") === "yes" ? 1 : 0})`
    );
    if (!doc.head) {
      return;
    }
    if (!style) {
      style = doc.createElement("style");
      style.id = "default-style";
      style.textContent = css;
      doc.head.appendChild(style);
      return;
    }
    style.textContent = css;
  }
  static addHtmlCss() {
    let iframe = document.getElementsByTagName("iframe")[0];
    if (!iframe) return;
    let doc = iframe.contentDocument;
    if (!doc) return;
    let css = this.getDefaultCss();
    let style = doc.getElementById("default-style");
    let background = document.querySelector(".viewer");
    if (!background) return;
    background!.setAttribute(
      "style",
      `background-color:${OtherUtil.getReaderConfig(
        "backgroundColor"
      )};filter: brightness(${
        OtherUtil.getReaderConfig("brightness") || 1
      }) invert(${OtherUtil.getReaderConfig("isInvert") === "yes" ? 1 : 0})`
    );
    window.frames[0].document.body.setAttribute(
      "style",
      this.getCustomCss() as string
    );
    if (!style) {
      style = doc.createElement("style");
      style.id = "default-style";
      style.textContent = css;
      doc.head.appendChild(style);
      return;
    }
    style.textContent = css;
  }
  // 获取为文档默认应用的css样式
  static getDefaultCss() {
    let colors = ["#FBF1D1", "#EFEEB0", "#CAEFC9", "#76BEE9"];
    let lines = ["#FF0000", "#000080", "#0000FF", "#2EFF2E"];

    return `::selection{background:#f3a6a68c}::-moz-selection{background:#f3a6a68c}[class*=color-]:hover{cursor:pointer;background-image:linear-gradient(0,rgba(0,0,0,.075),rgba(0,0,0,.075))}.color-0{background-color:${colors[0]}}.color-1{background-color:${colors[1]}}.color-2{background-color:${colors[2]}}.color-3{background-color:${colors[3]}}.line-0{border-bottom:2px solid ${lines[0]}}.line-1{border-bottom:2px solid ${lines[1]}}.line-2{border-bottom:2px solid ${lines[2]}}.line-3{border-bottom:2px solid ${lines[3]}}}img{max-width:100%}`;
  }
  static getCustomCss(isJSON: boolean = true) {
    if (isJSON) {
      return `font-size: ${
        OtherUtil.getReaderConfig("fontSize") || 17
      }px !important;line-height: ${
        OtherUtil.getReaderConfig("lineHeight") || "1.25"
      } !important;font-family: ${
        OtherUtil.getReaderConfig("fontFamily") || "Helvetica"
      } !important;color: ${
        OtherUtil.getReaderConfig("textColor")
          ? OtherUtil.getReaderConfig("textColor")
          : OtherUtil.getReaderConfig("backgroundColor") ===
              "rgba(44,47,49,1)" ||
            OtherUtil.getReaderConfig("isDisplayDark") === "yes"
          ? "white"
          : ""
      } !important;letter-spacing: ${
        OtherUtil.getReaderConfig("letterSpacing")
          ? OtherUtil.getReaderConfig("letterSpacing")
          : ""
      }px !important;text-align: ${
        OtherUtil.getReaderConfig("textAlign")
          ? OtherUtil.getReaderConfig("textAlign")
          : ""
      } !important;
      font-weight: ${
        OtherUtil.getReaderConfig("isBold") === "yes" ? "bold !important" : ""
      };font-style: ${
        OtherUtil.getReaderConfig("isItalic") === "yes"
          ? "italic !important"
          : ""
      };text-shadow: ${
        OtherUtil.getReaderConfig("isShadow") === "yes"
          ? "2px 2px 2px #cccccc !important"
          : ""
      };text-decoration: ${
        OtherUtil.getReaderConfig("isUnderline") === "yes"
          ? "underline !important"
          : ""
      };margin-bottom: ${
        OtherUtil.getReaderConfig("paraSpacing") || 0
      }px !important;padding:0`;
    } else {
      return {
        "a, article, cite, code, div, li, p, pre, span, table": {
          "font-size": `${
            OtherUtil.getReaderConfig("fontSize") || 17
          }px !important`,
          "line-height": `${
            OtherUtil.getReaderConfig("lineHeight") || "1.25"
          } !important`,
          "font-family": `${
            OtherUtil.getReaderConfig("fontFamily") || "Helvetica"
          } !important`,
          color: `${
            OtherUtil.getReaderConfig("textColor")
              ? OtherUtil.getReaderConfig("textColor")
              : OtherUtil.getReaderConfig("backgroundColor") ===
                  "rgba(44,47,49,1)" ||
                OtherUtil.getReaderConfig("isDisplayDark") === "yes"
              ? "white"
              : ""
          } !important`,
          "letter-spacing": `${
            OtherUtil.getReaderConfig("letterSpacing")
              ? `${OtherUtil.getReaderConfig("letterSpacing")}px`
              : ""
          } !important`,
          "text-align": `${
            OtherUtil.getReaderConfig("textAlign")
              ? `${OtherUtil.getReaderConfig("textAlign")}`
              : ""
          } !important`,
          "font-weight": `${
            OtherUtil.getReaderConfig("isBold") === "yes"
              ? "bold !important"
              : ""
          }`,
          "font-style": `${
            OtherUtil.getReaderConfig("isItalic") === "yes"
              ? "italic !important"
              : ""
          }`,
          "text-shadow": `${
            OtherUtil.getReaderConfig("isShadow") === "yes"
              ? "2px 2px 2px #cccccc !important"
              : ""
          }`,
          "text-decoration": `${
            OtherUtil.getReaderConfig("isUnderline") === "yes"
              ? "underline !important"
              : ""
          }`,
          "margin-bottom": `${
            OtherUtil.getReaderConfig("paraSpacing") || 0
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
    OtherUtil.getReaderConfig("themeColor") &&
      OtherUtil.getReaderConfig("themeColor") !== "default" &&
      this.addStyle(
        "./assets/styles/" + OtherUtil.getReaderConfig("themeColor") + ".css"
      );
  }
}

export default styleUtil;
