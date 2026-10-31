import type { OCRPlugin } from "../../types";
import {
  normalizeOcrText,
  parseImageBase64,
  throwOcrRequestError,
} from "./common";

export const recognize: OCRPlugin = async (imageBase64, axios, config) => {
  const accessToken = config.accessToken || "";
  const projectId = config.projectId || "";
  const location = config.location || "us";
  const processorId = config.processorId || "";

  if (!accessToken || !projectId || !processorId) {
    throw new Error(
      "Missing Google Document AI accessToken, projectId or processorId"
    );
  }

  try {
    const { base64, mimeType } = parseImageBase64(imageBase64);
    const endpoint = (
      config.endpoint || `https://${location}-documentai.googleapis.com`
    ).replace(/\/+$/, "");
    const url =
      `${endpoint}/v1/projects/${encodeURIComponent(String(projectId))}` +
      `/locations/${encodeURIComponent(String(location))}` +
      `/processors/${encodeURIComponent(String(processorId))}:process`;

    const res = await axios.post(
      url,
      {
        rawDocument: {
          content: base64,
          mimeType,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (res.data?.error) {
      throw new Error(
        res.data.error.message || "Google Document AI request failed"
      );
    }

    return normalizeOcrText(res.data?.document?.text);
  } catch (error) {
    throwOcrRequestError(error);
  }
};
