import axios from "axios";
import toast from "react-hot-toast";
import i18n from "../../i18n";
import { SSE } from "sse.js";
import { marked } from "marked";
import {
  CommonTool,
  ConfigService,
  TokenService,
} from "../../assets/lib/kookit-extra-browser.min";
import { getServerRegion, reloadManager } from "../common";
import { resetReaderRequest } from "./reader";
import { resetUserRequest } from "./user";
import { resetThirdpartyRequest } from "./thirdparty";
import { isElectron } from "react-device-detect";
const PUBLIC_URL = "https://api.koodoreader.com";
const CN_PUBLIC_URL = "https://api.koodoreader.cn";
let cachedPluginList: any[] | null = null;
export const getPublicUrl = () => {
  return getServerRegion() === "china" ? CN_PUBLIC_URL : PUBLIC_URL;
};
export const checkDeveloperUpdate = async () => {
  let res = await axios.get(
    getPublicUrl() + `/api/update_dev?name=${navigator.language}`
  );
  return res.data.log;
};
export const getPluginList = async () => {
  if (cachedPluginList) {
    return cachedPluginList;
  }
  let res = await axios.get(
    getPublicUrl() + `/api/get_plugins?name=${navigator.language}`
  );
  cachedPluginList = res.data.plugins;
  return res.data.plugins;
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
  resetReaderRequest();
  resetUserRequest();
  resetThirdpartyRequest();
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
  return new Promise<{ done: boolean }>((resolve, reject) => {
    const messages = [...chat, { role: "user", content: prompt }];
    const source = new SSE(url + "/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      payload: JSON.stringify({
        model,
        messages,
        stream: true,
        ...CommonTool.getDisableThinkingParams(providerId || ""),
      }),
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
const MINERU_AGENT_BASE = "https://mineru.net/api/v1/agent";

export const parseWithMineruAgent = async (file: any) => {
  const fileName = file?.name || "document.pdf";

  // Step 1: Get signed upload URL and task ID
  const createResp = await axios.post(`${MINERU_AGENT_BASE}/parse/file`, {
    file_name: fileName,
    language: "ch",
    enable_table: true,
    is_ocr: false,
    enable_formula: true,
  });

  if (createResp.data.code !== 0) {
    throw new Error(
      createResp.data.msg || "Failed to create MinerU parse task"
    );
  }

  const { task_id, file_url } = createResp.data.data;
  if (!task_id || !file_url) {
    throw new Error("Invalid response: missing task_id or file_url");
  }

  // Step 2: Upload file to signed OSS URL
  // Use ArrayBuffer to avoid fetch auto-setting Content-Type header,
  // which would break the OSS signature if Mineru signed without Content-Type
  const buffer = await file.arrayBuffer();
  const putResp = await fetch(file_url, {
    method: "PUT",
    body: buffer,
  });
  if (!putResp.ok) {
    throw new Error(`File upload failed, HTTP ${putResp.status}`);
  }

  // Step 3: Poll for result every 3 seconds
  const MAX_POLL_TIME = 5 * 60 * 1000;
  const POLL_INTERVAL = 3000;
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_POLL_TIME) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

    const pollResp = await axios.get(`${MINERU_AGENT_BASE}/parse/${task_id}`);
    const { state, markdown_url, err_msg } = pollResp.data.data;

    if (state === "done" && markdown_url) {
      // Step 4: Fetch markdown content
      const mdResp = await axios.get(markdown_url);
      const markdown = mdResp.data;
      console.log("MinerU parse completed successfully. Markdown:", markdown);

      // Step 5: Convert markdown to HTML
      const html = await marked.parse(markdown);
      console.log("MinerU parse completed successfully.", html);
      return {
        data: {
          text: html,
        },
      };
    }

    if (state === "failed") {
      throw new Error(err_msg || "MinerU parse failed");
    }
  }

  throw new Error(`MinerU parse timed out after ${MAX_POLL_TIME / 1000}s`);
};
export const parseWithSystemOCR = async (imageBase64: string) => {
  if (!isElectron) {
    return;
  }
  const { ipcRenderer } = window.require("electron");
  let result = await ipcRenderer.invoke("system-ocr", {
    base64: imageBase64,
    lang: "auto",
  });
  console.log("System OCR result:", result);
  return result.text || "";
};
