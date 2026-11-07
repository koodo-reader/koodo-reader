import type { OCRPlugin } from "../../types";
import {
  extractChatContent,
  normalizeOcrText,
  parseImageBase64,
  throwOcrRequestError,
} from "./common";

export const recognize: OCRPlugin = async (imageBase64, axios, config) => {
  const apiKey = config.apiKey || "";
  if (!apiKey) {
    throw new Error("Missing DashScope apiKey");
  }

  try {
    const baseUrl = (
      config.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1"
    ).replace(/\/+$/, "");
    const model = config.model || "qwen-vl-ocr";
    const { dataUrl } = parseImageBase64(imageBase64);
    const prompt =
      config.prompt ||
      "请识别图片中的所有文字，按原文顺序输出，不要添加任何解释。";

    const res = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model,
        stream: false,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: prompt },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (res.data?.error) {
      throw new Error(res.data.error.message || "Qwen OCR request failed");
    }

    return normalizeOcrText(
      extractChatContent(res.data?.choices?.[0]?.message?.content)
    );
  } catch (error) {
    throwOcrRequestError(error);
  }
};
