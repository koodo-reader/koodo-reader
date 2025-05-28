import Plugin from "../models/Plugin";
import { isElectron } from "react-device-detect";
import SparkMD5 from "spark-md5";
import {
  BookHelper,
  CommonTool,
  ConfigService,
  SyncUtil,
} from "../assets/lib/kookit-extra-browser.min";
import Book from "../models/Book";
import BookUtil from "./file/bookUtil";
import * as Kookit from "../assets/lib/kookit.min";
import DatabaseService from "./storage/databaseService";
import packageJson from "../../package.json";
import toast from "react-hot-toast";
import i18n from "../i18n";
import { getThirdpartyRequest } from "./request/thirdparty";
declare var window: any;
export const calculateFileMD5 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      const md5Hash = SparkMD5.ArrayBuffer.hash(arrayBuffer);
      resolve(md5Hash);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};
export const fetchFileFromPath = (filePath: string) => {
  return new Promise<File>((resolve) => {
    const fs = window.require("fs");

    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      const file = new File(
        [data],
        window.navigator.platform.indexOf("Win") > -1
          ? filePath.split("\\").reverse()[0]
          : filePath.split("/").reverse()[0],
        {
          lastModified: new Date().getTime(),
        }
      );
      resolve(file);
    });
  });
};

export const sleep = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

export const scrollContents = (chapterTitle: string, chapterHref: string) => {
  if (!chapterHref) return;

  let contentBody = document.getElementsByClassName("navigation-body")[0];
  if (!contentBody) return;
  let contentList = contentBody.getElementsByClassName("book-content-name");
  let targetContent = Array.from(contentList).filter((item) => {
    item.setAttribute("style", "");
    let dataHref = (item as any).getAttribute("data-href");
    return item.textContent === chapterTitle && dataHref === chapterHref;
  });
  if (targetContent.length > 0) {
    contentBody.scrollTo({
      left: 0,
      top: (targetContent[0] as any).offsetTop,
      behavior: "smooth",
    });
    targetContent[0].setAttribute("style", "color:red; font-weight: bold");
  }
};
export const handleFullScreen = () => {
  if (isElectron) {
    if (ConfigService.getReaderConfig("isOpenInMain") === "yes") {
      window
        .require("electron")
        .ipcRenderer.invoke("enter-tab-fullscreen", "ping");
    } else {
      window.require("electron").ipcRenderer.invoke("enter-fullscreen", "ping");
    }
  }
};
export const handleExitFullScreen = () => {
  if (isElectron) {
    if (ConfigService.getReaderConfig("isOpenInMain") === "yes") {
      window
        .require("electron")
        .ipcRenderer.invoke("exit-tab-fullscreen", "ping");
    } else {
      window.require("electron").ipcRenderer.invoke("exit-fullscreen", "ping");
    }
  }
};
export const getQueryParams = (url: string) => {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  const queryParams = {};
  for (let pair of params.entries()) {
    queryParams[pair[0]] = pair[1];
  }
  return queryParams;
};
export const getStorageLocation = () => {
  if (isElectron) {
    return ConfigService.getItem("storageLocation")
      ? ConfigService.getItem("storageLocation")
      : window
          .require("electron")
          .ipcRenderer.sendSync("storage-location", "ping");
  } else {
    return ConfigService.getItem("storageLocation");
  }
};
export const getAllVoices = (pluginList: Plugin[]) => {
  let voiceList: any[] = [];
  for (
    let index = 0;
    index < pluginList.filter((item) => item.type === "voice").length;
    index++
  ) {
    const plugin = pluginList.filter((item) => item.type === "voice")[index];
    voiceList.push(...(plugin.voiceList as any[]));
  }
  return voiceList;
};
export const checkPlugin = async (plugin: Plugin) => {
  if (
    (await CommonTool.generateSHA256Hash(plugin.script)) !== plugin.scriptSHA256
  ) {
    return false;
  } else {
    return true;
  }
};
export const reloadManager = () => {
  if (isElectron) {
    window.require("electron").ipcRenderer.invoke("reload-main", "ping");
  } else {
    window.location.reload();
  }
};
export const openExternalUrl = (url: string, isPlugin: boolean = false) => {
  isElectron
    ? ConfigService.getReaderConfig("isUseBuiltIn") === "yes" || isPlugin
      ? window.require("electron").ipcRenderer.invoke("open-url", { url })
      : window.require("electron").shell.openExternal(url)
    : window.open(url);
};
export const getPageWidth = (
  readerMode: string,
  scale: string,
  margin: number,
  isNavLocked: boolean,
  isSettingLocked: boolean
) => {
  const findValidMultiple = (limit: number) => {
    let multiple = limit - (limit % 12);

    while (multiple >= 0) {
      if (((multiple - multiple / 12) / 2) % 2 === 0) {
        return multiple;
      }
      multiple -= 12;
    }

    return limit;
  };
  let pageOffset = "";
  let pageWidth = "";
  if (readerMode === "scroll" || readerMode === "single") {
    let preWidth =
      document.body.clientWidth * parseFloat(scale) -
      document.body.clientWidth * 0.4 -
      (isNavLocked ? 300 : 0) -
      (isSettingLocked ? 300 : 0);
    let width = findValidMultiple(preWidth);
    pageOffset = `calc(50vw + ${isNavLocked ? 150 : 0}px - ${
      isSettingLocked ? 150 : 0
    }px - ${width / 2}px)`;
    pageWidth = `${width}px`;
  } else if (readerMode === "double") {
    let width = findValidMultiple(
      document.body.clientWidth -
        2 * margin -
        80 -
        (isNavLocked ? 300 : 0) -
        (isSettingLocked ? 300 : 0)
    );
    pageOffset = `calc(50vw + ${isNavLocked ? 150 : 0}px - ${
      isSettingLocked ? 150 : 0
    }px - ${width / 2}px)`;
    pageWidth = `${width}px`;
  }
  return {
    pageOffset,
    pageWidth,
  };
};
export const loadFontData = async () => {
  try {
    if (!window.queryLocalFonts) return [];
    const availableFonts = await window.queryLocalFonts();
    return availableFonts.map((font: any) => {
      return {
        label: font.fullName,
        value: `"${font.fullName}", "${font.postscriptName}", "${font.family}"`,
      };
    });
  } catch (err) {
    console.error(err);
  }
};
export const splitSentences = (text) => {
  // 正则表达式匹配中英文句子结束标点（包括后续可能跟的引号或空格）
  const pattern = /([。！？……——.!?…—][’”"]?\s*)/g;

  // 按标点分割，同时保留标点符号
  const parts = text.split(pattern);

  // 过滤空字符串并整理结果
  const sentences: string[] = [];
  let currentSentence = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // 如果是标点部分
    if (/^[。！？……——.!?…—]/.test(part)) {
      currentSentence += part;
      sentences.push(currentSentence.trim());
      currentSentence = "";
    } else {
      currentSentence += part;
    }
  }

  // 添加最后未结束的句子
  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim());
  }

  return sentences.filter((s) => s.length > 0);
};
export function removeSearchParams() {
  const url = new URL(window.location.href.split("?")[0]);
  window.history.replaceState({}, document.title, url.toString());
}
export const getChatLocale = () => {
  if (navigator.language.startsWith("zh")) {
    return "zh_CN";
  } else {
    return "en";
  }
};
export function addChatBox() {
  const scriptContent = `
    (function (d, t) {
      var BASE_URL = "https://app.chatwoot.com";
      var g = d.createElement(t),
        s = d.getElementsByTagName(t)[0];
      g.src = BASE_URL + "/packs/js/sdk.js";
      g.defer = true;
      g.async = true;
      s.parentNode.insertBefore(g, s);
      g.onload = function () {
        window.chatwootSDK.run({
          websiteToken: "svaD5wxfU5UY1r5ZzpMtLqv2",
          baseUrl: BASE_URL,
        });
        window.addEventListener('chatwoot:ready', function() {
          window.$chatwoot.setLocale('${getChatLocale()}');
          window.$chatwoot.setCustomAttributes({
            version: '${packageJson.version}',
            client: 'web',
          });
        });
      };
    })(document, "script");
  `;

  const scriptElement = document.createElement("script");
  scriptElement.type = "text/javascript";
  scriptElement.text = scriptContent;
  document.head.appendChild(scriptElement);
}
export function removeChatBox() {
  const scriptElement = document.querySelector("script[src*='chatwoot']");
  if (scriptElement) {
    scriptElement.remove();
  }
}
export const preCacheAllBooks = async (bookList: Book[]) => {
  for (let index = 0; index < bookList.length; index++) {
    const selectedBook = bookList[index];
    if (selectedBook.format === "PDF") {
      continue;
    }
    if (
      await BookUtil.isBookExist(
        "cache-" + selectedBook.key,
        "zip",
        selectedBook.path
      )
    ) {
      continue;
    }

    let result: any = await BookUtil.fetchBook(
      selectedBook.key,
      selectedBook.format.toLowerCase(),
      true,
      selectedBook.path
    );
    let rendition = BookHelper.getRendtion(
      result,
      selectedBook.format,
      "",
      selectedBook.charset,
      ConfigService.getReaderConfig("isSliding") === "yes" ? "sliding" : "",
      ConfigService.getReaderConfig("convertChinese"),
      "",
      "no",
      "no",
      Kookit
    );
    let cache = await rendition.preCache(result);
    if (cache !== "err" || cache) {
      BookUtil.addBook("cache-" + selectedBook.key, "zip", cache);
    }
  }
};
export const generateSyncRecord = async () => {
  for (let database of CommonTool.databaseList) {
    let itemList = await DatabaseService.getAllRecords(database);
    for (let item of itemList) {
      ConfigService.setSyncRecord(
        {
          type: "database",
          catergory: "sqlite",
          name: database,
          key: item.key,
        },
        { operation: "save", time: Date.now() }
      );
    }
  }
  for (let config of CommonTool.configList) {
    if (
      config === "themeColors" ||
      config === "recentBooks" ||
      config === "deletedBooks" ||
      config === "favoriteBooks" ||
      config === "noteTags"
    ) {
      if (ConfigService.getAllListConfig(config).length > 0) {
        ConfigService.setSyncRecord(
          {
            type: "config",
            catergory: "listConfig",
            name: "general",
            key: config,
          },
          {
            operation: "update",
            time: Date.now(),
          }
        );
      }
    }
    if (config === "readingTime" || config === "recordLocation") {
      let configItems: string[] = Object.keys(
        ConfigService.getAllObjectConfig(config)
      );
      for (let index = 0; index < configItems.length; index++) {
        let itemName = configItems[index];
        ConfigService.setSyncRecord(
          {
            type: "config",
            catergory: "objectConfig",
            name: config,
            key: itemName,
          },
          {
            operation: "update",
            time: Date.now(),
          }
        );
      }
    }
    if (config === "shelfList") {
      let itemMap = ConfigService.getAllMapConfig(config);
      let itemNameList = Object.keys(itemMap);
      for (let index = 0; index < itemNameList.length; index++) {
        let itemName = itemNameList[index];
        if (itemName === "New") continue;
        ConfigService.setSyncRecord(
          {
            type: "config",
            catergory: "mapConfig",
            name: config,
            key: itemName,
          },
          {
            operation: "update",
            time: Date.now(),
          }
        );
      }
    }
  }
};
export const handleContextMenu = (id: string, isInput: boolean = false) => {
  if (!isElectron) return;
  const clipboard = window.require("electron").clipboard;
  const text = clipboard.readText();
  // fill the text into the box
  if (!isInput) {
    let textarea = document.getElementById(id) as HTMLTextAreaElement;
    textarea.value = text;
    textarea.textContent = text;
    triggerReactChange(id, text);
  } else {
    document.getElementById(id)?.setAttribute("value", text);
    triggerReactChange(id, text);
  }
};
function triggerReactChange(id: string, value: string) {
  const element: any = document.getElementById(id);
  if (!element) return;

  // 设置值
  element.value = value;

  // 创建合成事件对象
  const syntheticEvent = {
    target: {
      id: id,
      value: value,
    },
    currentTarget: {
      value: value,
    },
    preventDefault: () => {},
    stopPropagation: () => {},
  };

  // 获取 React 实例
  const reactPropKey = Object.keys(element).find((key) =>
    key.startsWith("__reactProps$")
  );
  const reactInstance = reactPropKey ? element[reactPropKey] : null;

  // 调用 onChange 处理函数
  if (reactInstance && reactInstance.onChange) {
    reactInstance.onChange(syntheticEvent);
  }
}
export const getDefaultTransTarget = (langList) => {
  //reverse key and value
  let langMap = {};
  for (let key in langList) {
    langMap[langList[key]] = key;
  }
  const langMap2 = {
    zhCN: "Chinese",
    zhTW: "Chinese",
    zhMO: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    vi: "Vietnamese",
    th: "Thai",
    ru: "Russian",
    ar: "Arabic",
    fr: "French",
    de: "German",
    es: "Spanish",
    it: "Italian",
    pt: "Portuguese",
    ptBR: "Portuguese",
    nl: "Dutch",
    id: "Indonesian",
    tr: "Turkish",
    pl: "Polish",
    cs: "Czech",
    sv: "Swedish",
    bn: "Bengali",
    tl: "Tagalog",
    ga: "Irish",
    bg: "Bulgarian",
    fa: "Persian",
  };
  const lang = ConfigService.getReaderConfig("lang");
  const langKeys = Object.keys(langMap);
  let langTarget = langKeys.find((key) => key.includes(langMap2[lang]));
  return langMap[langTarget || "English"];
};
export const WEBSITE_URL = "https://koodoreader.com";
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  // return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  return date.toLocaleDateString();
};
export const checkMissingBook = (bookList: Book[]) => {
  if (!isElectron) return;
  var fs = window.require("fs");
  var path = window.require("path");
  for (let index = 0; index < bookList.length; index++) {
    const book = bookList[index];
    let fileName = book.key + "." + book.format.toLowerCase();
    let expectedPath = path.join(getStorageLocation() || "", `book`, fileName);
    if (fs.existsSync(expectedPath)) {
      continue;
    }
    // create folder if not exists
    if (!fs.existsSync(path.join(getStorageLocation() || "", "book"))) {
      fs.mkdirSync(path.join(getStorageLocation() || "", "book"), {
        recursive: true,
      });
    }
    if (book.path && fs.existsSync(book.path)) {
      fs.copyFileSync(book.path, expectedPath);
    }
  }
};
export const testConnection = async (driveName: string, driveConfig: any) => {
  toast.loading(i18n.t("Testing connection..."), {
    id: "testing-connection-id",
  });
  if (isElectron) {
    const { ipcRenderer } = window.require("electron");
    const fs = window.require("fs");
    if (!fs.existsSync(getStorageLocation() + "/config")) {
      fs.mkdirSync(getStorageLocation() + "/config", { recursive: true });
    }
    fs.writeFileSync(getStorageLocation() + "/config/test.txt", "Hello world!");
    let result = await ipcRenderer.invoke("cloud-upload", {
      ...driveConfig,
      fileName: "test.txt",
      service: driveName,
      type: "config",
      storagePath: getStorageLocation(),
      isUseCache: false,
    });
    if (result) {
      toast.success(i18n.t("Connection successful"), {
        id: "testing-connection-id",
      });
      await ipcRenderer.invoke("cloud-delete", {
        ...driveConfig,
        fileName: "test.txt",
        service: driveName,
        type: "config",
        storagePath: getStorageLocation(),
        isUseCache: false,
      });
    } else {
      toast.error(i18n.t("Connection failed"), {
        id: "testing-connection-id",
      });
    }
    if (fs.existsSync(getStorageLocation() + "/config/test.txt")) {
      fs.unlinkSync(getStorageLocation() + "/config/test.txt");
    }
    return result;
  } else {
    let thirdpartyRequest = await getThirdpartyRequest();
    let syncUtil = new SyncUtil(driveName, driveConfig, thirdpartyRequest);
    // 上传到云端
    let result = await syncUtil.uploadFile(
      "test.txt",
      "config",
      new Blob(["Hello world!"])
    );
    if (!result) {
      toast.error(i18n.t("Connection failed"), {
        id: "testing-connection-id",
      });
      return false;
    } else {
      toast.success(i18n.t("Connection successful"), {
        id: "testing-connection-id",
      });
    }

    // 删除云端文件
    return await syncUtil.deleteFile("test.txt", "config");
  }
};
export const getTargetHref = (event: any) => {
  let href =
    (event.target.innerText && event.target.innerText.startsWith("http")) ||
    (event.target.tagName !== "IMG" && event.target.getAttribute("href")) ||
    (event.target.tagName !== "IMG" && event.target.getAttribute("src")) ||
    (event.target.parentNode &&
      ((event.target.parentNode.getAttribute &&
        event.target.parentNode.getAttribute("href")) ||
        (event.target.parentNode.getAttribute &&
          event.target.parentNode.getAttribute("src")))) ||
    (event.target.parentNode.parentNode &&
      ((event.target.parentNode.parentNode.getAttribute &&
        event.target.parentNode.parentNode.getAttribute("href")) ||
        (event.target.parentNode.parentNode.getAttribute &&
          event.target.parentNode.parentNode.getAttribute("src")))) ||
    "";
  return href;
};
