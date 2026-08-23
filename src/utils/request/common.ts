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
  if (isElectron) {
    return await window.electronAPI.invoke("ai-request", {
      url,
      method,
      headers,
      body,
    });
  }
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

  if (isElectron) {
    return new Promise<{ done: boolean }>((resolve, reject) => {
      const ipcRenderer = window.electronAPI;
      const streamId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);

      const onChunk = (data: any) => {
        if (data && data.streamId === streamId && data.text) {
          onMessage({ text: data.text });
        }
      };
      const onDone = (data: any) => {
        if (data && data.streamId === streamId) {
          cleanup();
          resolve({ done: true });
        }
      };
      const onError = (data: any) => {
        if (data && data.streamId === streamId) {
          cleanup();
          const errMsg =
            data.error ||
            (data.status ? `HTTP ${data.status}` : "Unknown error");
          toast.error(errMsg, { id: "chat-stream-error", duration: 5000 });
          reject(new Error(errMsg));
        }
      };
      const cleanup = () => {
        ipcRenderer.removeListener("ai-chat-chunk", onChunk);
        ipcRenderer.removeListener("ai-chat-done", onDone);
        ipcRenderer.removeListener("ai-chat-error", onError);
      };

      ipcRenderer.on("ai-chat-chunk", onChunk);
      ipcRenderer.on("ai-chat-done", onDone);
      ipcRenderer.on("ai-chat-error", onError);

      ipcRenderer
        .invoke("ai-chat-stream", {
          streamId,
          url: chatUrl,
          headers,
          body: payload,
        })
        .catch((err: any) => {
          cleanup();
          reject(err);
        });
    });
  }

  return new Promise<{ done: boolean }>((resolve, reject) => {
    const source = new SSE(chatUrl, {
      headers,
      payload,
      method: "POST",
    });

    source.addEventListener("open", () => {
      console.info("ChatStream connection established.");
    });

    source.addEventListener("message", (e: any) => {
      if (!e.data) return;
      if (e.data === "[DONE]") {
        source.close();
        resolve({ done: true });
        return;
      }
      try {
        const json = JSON.parse(e.data);
        const text = json?.choices?.[0]?.delta?.content;
        if (text) {
          onMessage({ text });
        }
      } catch (err) {
        console.error("ChatStream parse error:", err);
      }
    });

    source.addEventListener("error", (e: any) => {
      console.error("ChatStream error:", e);
      toast.error(e.data ? JSON.stringify(e.data) : "Unknown error", {
        id: "chat-stream-error",
        duration: 5000,
      });
      source.close();
      reject(e);
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
