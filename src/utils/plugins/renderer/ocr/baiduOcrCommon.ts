import type { AxiosInstance } from "axios";
import type { PluginConfig } from "../../types";
import { parseImageBase64, throwOcrRequestError } from "./common";

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

const getAccessToken = async (
  apiKey: string,
  secretKey: string,
  axios: AxiosInstance
): Promise<string> => {
  const cacheKey = `${apiKey}:${secretKey}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const res = await axios.post(
    "https://aip.baidubce.com/oauth/2.0/token",
    null,
    {
      params: {
        grant_type: "client_credentials",
        client_id: apiKey,
        client_secret: secretKey,
      },
    }
  );

  if (!res.data?.access_token) {
    throw new Error(
      res.data?.error_description || "Failed to get Baidu OCR access token"
    );
  }

  const expiresIn = Number(res.data.expires_in) || 2592000;
  tokenCache.set(cacheKey, {
    token: res.data.access_token,
    expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000,
  });
  return res.data.access_token;
};

export const recognizeWithBaidu = async (
  endpoint: string,
  imageBase64: string,
  axios: AxiosInstance,
  config: PluginConfig
): Promise<string[]> => {
  const apiKey = config.apiKey || "";
  const secretKey = config.secretKey || "";

  if (!apiKey || !secretKey) {
    throw new Error("Missing Baidu OCR apiKey or secretKey");
  }

  try {
    const { base64 } = parseImageBase64(imageBase64);
    const accessToken = await getAccessToken(apiKey, secretKey, axios);
    const body = new URLSearchParams();
    body.append("image", base64);
    if (config.language) {
      body.append("language_type", String(config.language));
    }

    const res = await axios.post(endpoint, body.toString(), {
      params: { access_token: accessToken },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (res.data?.error_code) {
      throw new Error(
        `${res.data.error_code}: ${
          res.data.error_msg || "Baidu OCR request failed"
        }`
      );
    }

    const results = Array.isArray(res.data?.words_result)
      ? res.data.words_result
      : [];
    return results
      .map((item: { words?: string }) => String(item?.words || ""))
      .filter(Boolean);
  } catch (error) {
    throwOcrRequestError(error);
  }
};
