import axios from "axios";
import toast from "react-hot-toast";
import i18n from "../../i18n";
import { SSE } from "sse.js";
import {
  CommonTool,
  ConfigService,
} from "../../assets/lib/kookit-extra-browser.min";
import { getServerRegion, reloadManager } from "../common";
import { resetReaderRequest } from "./reader";
import { resetUserRequest } from "./user";
import { resetThirdpartyRequest } from "./thirdparty";
import { isElectron } from "react-device-detect";
import TokenService from "../storage/tokenService";
const PUBLIC_URL = "https://api.koodoreader.com";
const CN_PUBLIC_URL = "https://api.koodoreader.cn";
export const getPublicUrl = () => {
  return getServerRegion() === "china" ? CN_PUBLIC_URL : PUBLIC_URL;
};
export const checkDeveloperUpdate = async () => {
  let res = await axios.get(
    getPublicUrl() + `/api/update_dev?name=${navigator.language}`
  );
  return res.data.log;
};
export const uploadFile = async (url: string, file: any) => {
  return new Promise<boolean>((resolve) => {
    axios
      .put(url, file, {})
      .then(() => {
        resolve(true);
      })
      .catch((err) => {
        console.error(err);
        resolve(false);
      });
  });
};
export const checkStableUpdate = async () => {
  let res = await axios.get(
    getPublicUrl() + `/api/update?name=${navigator.language}`
  );
  return res.data.log;
};
export const handleExitApp = async () => {
  toast.error(i18n.t("Authorization failed, please login again"));
  await handleClearToken();
  //路由到login页面
  reloadManager();
};
export const handleClearToken = async () => {
  await TokenService.deleteToken("is_authed");
  await TokenService.deleteToken("access_token");
  await TokenService.deleteToken("refresh_token");
  let dataSourceList = ConfigService.getAllListConfig("dataSourceList") || [];
  for (let i = 0; i < dataSourceList.length; i++) {
    let targetDrive = dataSourceList[i];
    await TokenService.setToken(targetDrive + "_token", "");
  }
  ConfigService.removeItem("defaultSyncOption");
  ConfigService.removeItem("dataSourceList");
  ConfigService.setReaderConfig("dictService", "");
  ConfigService.setReaderConfig("transService", "");
  ConfigService.setReaderConfig("aiService", "");
  resetReaderRequest();
  resetUserRequest();
  resetThirdpartyRequest();
};

export const aiRequest = async (
  url: string,
  method: "GET" | "POST",
  headers: Record<string, string>,
  body?: string
): Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  body: string;
}> => {
  const response = await fetch(url, {
    method,
    headers,
    body: method === "POST" ? body : undefined,
  });
  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body: text,
  };
};

export const chatStream = async (
  url: string,
  providerId: string,
  apiKey: string,
  model: string,
  prompt: string,
  chat: any[],
  onMessage: (result) => void
) => {
  const messages = [...chat, { role: "user", content: prompt }].slice(-5);
  const chatUrl = url + "/chat/completions";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + apiKey,
  };
  const payload = JSON.stringify({
    model,
    messages,
    stream: true,
    ...CommonTool.getDisableThinkingParams(providerId || ""),
  });

  return new Promise<{ done: boolean }>((resolve, reject) => {
    let settled = false;
    const source = new SSE(chatUrl, {
      headers,
      payload,
      method: "POST",
    });

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      source.close();
      resolve({ done: true });
    };

    // 流式剔除 <think>...</think> 思考内容，只透传最终回答
    const OPEN_TAG = "<think>";
    const CLOSE_TAG = "</think>";
    let inThink = false;
    let thinkPassed = false;
    let tagBuffer = "";

    const flushText = (text: string) => {
      if (text) {
        onMessage({ text });
      }
    };

    const processDelta = (raw: string) => {
      if (thinkPassed) {
        flushText(raw);
        return;
      }
      tagBuffer += raw;
      let output = "";
      while (tagBuffer) {
        const tag = inThink ? CLOSE_TAG : OPEN_TAG;
        const idx = tagBuffer.indexOf(tag);
        if (idx !== -1) {
          if (!inThink) {
            output += tagBuffer.slice(0, idx);
          }
          tagBuffer = tagBuffer.slice(idx + tag.length);
          inThink = !inThink;
          thinkPassed = !inThink;
          if (thinkPassed) {
            tagBuffer = tagBuffer.replace(/^\s+/, "");
          }
          continue;
        }
        // 保留可能是半个标签的尾部，等下一个分片拼齐后再判断
        let keep = 0;
        for (
          let len = Math.min(tagBuffer.length, tag.length - 1);
          len > 0;
          len--
        ) {
          if (tag.startsWith(tagBuffer.slice(-len))) {
            keep = len;
            break;
          }
        }
        if (!inThink) {
          output += tagBuffer.slice(0, tagBuffer.length - keep);
        }
        tagBuffer = tagBuffer.slice(tagBuffer.length - keep);
        break;
      }
      flushText(output);
    };

    source.addEventListener("open", () => {
      console.info("ChatStream connection established.");
    });

    source.addEventListener("message", (e: any) => {
      if (!e.data) return;
      if (e.data.trim() === "[DONE]") {
        finish();
        return;
      }
      try {
        const json = JSON.parse(e.data);
        const text = json?.choices?.[0]?.delta?.content;
        if (text) {
          processDelta(text);
        }
        const finishReason = json?.choices?.[0]?.finish_reason;
        if (finishReason) {
          finish();
        }
      } catch (err) {
        console.error("ChatStream parse error:", err);
      }
    });

    source.addEventListener("error", (e: any) => {
      if (settled) {
        return;
      }
      settled = true;
      console.error("ChatStream error:", e);
      toast.error(e.data ? JSON.stringify(e.data) : "Unknown error", {
        id: "chat-stream-error",
        duration: 5000,
      });
      source.close();
      reject(e);
    });

    // SSE 连接结束时（无论服务端是否发送 [DONE]）都要结束流，
    // 否则上层 stopUpdateInterval 不会被调用，自动滚底定时器会一直运行
    source.addEventListener("readystatechange", () => {
      if (source.readyState === SSE.CLOSED) {
        finish();
      }
    });
  });
};
export const getNotification = async () => {
  let deviceUuid = await TokenService.getFingerprint();
  const res = await axios.post(
    "https://api.koodoreader.com/api/get_notification",
    {
      device_uuid: deviceUuid,
    }
  );
  // {
  // 	"result": "ok",
  // 	"unread": 0
  // }
  return res;
};
export const parseWithSystemOCR = async (imageBase64: string) => {
  if (!isElectron) {
    return;
  }
  const ipcRenderer = window.electronAPI;
  let result = await ipcRenderer.invoke("system-ocr", {
    base64: imageBase64,
    lang: "auto",
  });
  return result.text || "";
};
