// 工具类
import ReaderConfig from "./readerConfig";

class StyleConfig {
  // 获取元素的样式
  static getStyle(element, attr) {
    if (element.currentStyle !== null) {
      return element.currentStyle[attr];
    } else {
      return getComputedStyle(element)[attr];
    }
  }

  // 为指定文档添加(user)脚本
  static addScript(script, doc = document) {
    let scriptEl = doc.getElementById("qiu-user-script");

    if (!scriptEl) {
      scriptEl = doc.createElement("script");
      scriptEl.id = "qiu-user-script";
      scriptEl.type = "text/javascript";
      scriptEl.defer = true;
      scriptEl.text = script;
      doc.body.appendChild(scriptEl);
      return;
    }

    scriptEl.text = script;
  }

  // 为指定文档添加(user)样式
  static addCss(css, doc = document) {
    let style = doc.getElementById("qiu-user-style");

    if (!style) {
      style = doc.createElement("style");
      style.id = "qiu-user-style";
      style.textContent = css;
      doc.head.appendChild(style);
      return;
    }

    style.textContent = css;
  }

  // 为 iframe 添加默认的样式
  static addDefaultCss() {
    let css = ReaderConfig.getDefaultCss();
    let iDoc = document.getElementsByTagName("iframe")[0].contentDocument;
    let style = iDoc.getElementById("default-style");
    let background = document.querySelector(".background");
    // let iframe = document.querySelector("iframe");
    background.setAttribute(
      "style",
      `background-color:${ReaderConfig.get().theme}`
    );
    // let height =
    //   document.documentElement.clientHeight - ReaderConfig.get().padding * 2;
    // console.log(ReaderConfig.get().padding, "height");
    // let width =
    //   document.documentElement.clientWidth - ReaderConfig.get().padding * 2;
    // iframe.setAttribute("width", `${width}px`);
    // iframe.setAttribute("height", `${height}px`);
    // iframe.setAttribute(
    //   "style",
    //   ` position: relative; left:${ReaderConfig.get().padding}px; top:${
    //     ReaderConfig.get().padding
    //   }px;`
    // );
    // iFrame.removeAttribute("width");
    // iFrame.removeAttribute("width");
    // iFrame.setAttribute("style", ``);
    if (!style) {
      style = iDoc.createElement("style");
      style.id = "default-style";
      style.textContent = css;

      iDoc.head.appendChild(style);
      return;
    }
    style.textContent = css;
  }

  // 获取用户自定义的样式
  // 返回一个对象 {outer: outerStyle, inner: innerStyle}
  static getUserStyle() {
    let json = localStorage.getItem("style") || "{}";

    return JSON.parse(json);
  }

  // 解析用户传入的样式表
  static parseStyle(style) {
    const separator = "/* Qiu Plus Separator */";
    let arr = style.split(separator);
    let out = {
      inner: arr[0] || "",
      outer: arr[1] || ""
    };

    return out;
  }

  // 获取用户自定义的脚本
  // 返回一个对象 {outer: outerScript, inner: innerScript}
  static getUserScript() {
    let json = localStorage.getItem("script") || "{}";

    return JSON.parse(json);
  }

  // 解析用户传入的脚本
  static parseScript(script) {
    const separator = "/* Qiu Plus Separator */";
    let arr = script.split(separator);
    let out = {
      inner: arr[0] || "",
      outer: arr[1] || ""
    };

    return out;
  }

  // 应用外部的样式
  static applyCss() {
    let outerDoc = document;
    let innerDoc = document.getElementsByTagName("iframe")[0].contentDocument;
    let style = StyleConfig.getUserStyle();
    style.inner && StyleConfig.addCss(style.inner, innerDoc);
    style.outer && StyleConfig.addCss(style.outer, outerDoc);
  }

  // 应用外部的样式
  static applyScript() {
    let outerDoc = document;
    let innerDoc = document.getElementsByTagName("iframe")[0].contentDocument;
    let script = StyleConfig.getUserScript();
    script.inner && StyleConfig.addCss(script.inner, innerDoc);
    script.outer && StyleConfig.addCss(script.outer, outerDoc);
  }

  // 取消自定义的样式
  static resetStyle() {
    let style = {
      inner: " ",
      outer: " "
    };
    localStorage.setItem("style", JSON.stringify(style));
    ReaderConfig.resetConfig();

    StyleConfig.applyCss();
    StyleConfig.addDefaultCss();
  }

  // 取消用户自定义脚本
  static resetScript() {
    let script = {
      inner: " ",
      outer: " "
    };
    localStorage.setItem("script", JSON.stringify(script));
    StyleConfig.applyScript();
  }
}

export default StyleConfig;
