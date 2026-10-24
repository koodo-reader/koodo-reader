import type { OCRPlugin } from "../../types";
import {
  extractChatContent,
  parseImageBase64,
  splitTextToLines,
  throwOcrRequestError,
} from "./common";

export const recognize: OCRPlugin = async (imageBase64, axios, config) => {
  const apiKey = config.apiKey || "";
  if (!apiKey) {
    throw new Error("Missing OpenAI compatible apiKey");
  }

  try {
    const baseUrl = (
      config.baseUrl || "https://api.siliconflow.cn/v1"
    ).replace(/\/+$/, "");
    const model = config.model || "Qwen/Qwen2.5-VL-72B-Instruct";
    const { dataUrl } = parseImageBase64(imageBase64);
    const prompt =
      config.prompt ||
      "请识别图片中的所有文字，按原文顺序输出，不要添加任何解释。";

    const res = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model,
        temperature: 0,
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
      throw new Error(
        res.data.error.message || "OpenAI compatible OCR request failed"
      );
    }

    return splitTextToLines(
      extractChatContent(res.data?.choices?.[0]?.message?.content)
    );
  } catch (error) {
    throwOcrRequestError(error);
  }
};
