import ConfigService from "./storage/configService";
import Plugin from "../models/Plugin";
import { isElectron } from "react-device-detect";
import SparkMD5 from "spark-md5";
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
  return new Promise<File>((resolve, reject) => {
    const fs = window.require("fs");

    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.log(err);
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

export const copyArrayBuffer = (src) => {
  var dst = new ArrayBuffer(src.byteLength);
  new Uint8Array(dst).set(new Uint8Array(src));
  return dst;
};
export const base64ArrayBuffer = (arrayBuffer: ArrayBuffer) => {
  var base64 = "";
  var encodings =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var bytes = new Uint8Array(arrayBuffer);
  var byteLength = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength = byteLength - byteRemainder;
  var a, b, c, d;
  var chunk;
  for (var i = 0; i < mainLength; i = i + 3) {
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    a = (chunk & 16515072) >> 18;
    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63; // 63       = 2^6 - 1
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  if (byteRemainder === 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
    b = (chunk & 3) << 4; // 3   = 2^2 - 1
    base64 += encodings[a] + encodings[b] + "==";
  } else if (byteRemainder === 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4
    c = (chunk & 15) << 2; // 15    = 2^4 - 1
    base64 += encodings[a] + encodings[b] + encodings[c] + "=";
  }

  return base64;
};

export const scrollContents = (chapterTitle: string, chapterHref: string) => {
  if (!chapterHref) return;

  let contentBody = document.getElementsByClassName("navigation-body")[0];
  if (!contentBody) return;
  let contentList = contentBody.getElementsByClassName("book-content-name");
  let targetContent = Array.from(contentList).filter((item, index) => {
    item.setAttribute("style", "");
    return item.textContent === chapterTitle;
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
export async function generateSHA256Hash(message) {
  // Encode the message as a Uint8Array
  const msgBuffer = new TextEncoder().encode(message);

  // Hash the message
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

  // Convert the hash to a byte array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Convert the byte array to a hex string
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}
export const getStorageLocation = () => {
  if (isElectron) {
    return localStorage.getItem("storageLocation")
      ? localStorage.getItem("storageLocation")
      : window
          .require("electron")
          .ipcRenderer.sendSync("storage-location", "ping");
  } else {
    return localStorage.getItem("storageLocation");
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
  if ((await generateSHA256Hash(plugin.script)) !== plugin.scriptSHA256) {
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
export const openExternalUrl = (url: string) => {
  isElectron
    ? ConfigService.getReaderConfig("isUseBuiltIn") === "yes"
      ? window.open(url)
      : window.require("electron").shell.openExternal(url)
    : window.open(url);
};
export const getPageWidth = (
  readerMode: string,
  scale: string,
  margin: number
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
  if (document.body.clientWidth < 570) {
    let width = findValidMultiple(document.body.clientWidth - 72);
    pageOffset = `calc(50vw - ${width / 2}px)`;
    pageWidth = `${width}px`;
  } else if (readerMode === "scroll") {
    let width = findValidMultiple(276 * parseFloat(scale) * 2);

    pageOffset = `calc(50vw - ${width / 2}px)`;
    pageWidth = `${width}px`;
  } else if (readerMode === "single") {
    let width = findValidMultiple(276 * parseFloat(scale) * 2 - 36);

    pageOffset = `calc(50vw - ${width / 2}px)`;
    pageWidth = `${width}px`;
  } else if (readerMode === "double") {
    let width = findValidMultiple(document.body.clientWidth - 2 * margin - 80);
    pageOffset = `calc(50vw - ${width / 2}px)`;
    pageWidth = `${width}px`;
  }
  return {
    pageOffset,
    pageWidth,
  };
};
