import { getIframeDoc } from "./docUtil";
import {
  ConfigService,
  StyleHelper,
} from "../../assets/lib/kookit-extra-browser.min";

class styleUtil {
  // add default css for iframe
  static addDefaultCss() {
    let doc = getIframeDoc("ANY")[0];
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
      }) invert(${
        ConfigService.getReaderConfig("isInvert") === "yes" ? 1 : 0
      });`
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
    return StyleHelper.getDefaultCss(ConfigService);
  }

  static applyTheme() {
    if (
      ConfigService.getReaderConfig("themeColor") &&
      ConfigService.getReaderConfig("themeColor") !== "default"
    ) {
      const style = document.createElement("link");
      style.href =
        "./assets/styles/" +
        ConfigService.getReaderConfig("themeColor") +
        ".css";
      style.rel = "stylesheet";
      document.head.appendChild(style);
    }
  }
}

export default styleUtil;
