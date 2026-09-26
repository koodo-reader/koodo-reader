import { CommonTool } from "../../assets/lib/kookit-extra-browser.min";
import type {
  CustomRendererPluginRecord,
  CustomVoicePluginRecord,
  DictionaryPlugin,
  RendererPluginType,
  TranslatePlugin,
} from "./types";

const isRendererPluginType = (type: unknown): type is RendererPluginType =>
  type === "translation" || type === "dictionary";

export const isCustomRendererPlugin = (
  plugin: unknown
): plugin is CustomRendererPluginRecord => {
  if (!plugin || typeof plugin !== "object") return false;
  const record = plugin as Record<string, unknown>;
  return (
    typeof record.key === "string" &&
    isRendererPluginType(record.type) &&
    typeof record.script === "string" &&
    typeof record.scriptSHA256 === "string"
  );
};

export const isCustomVoicePlugin = (
  plugin: unknown
): plugin is CustomVoicePluginRecord => {
  if (!plugin || typeof plugin !== "object") return false;
  const record = plugin as Record<string, unknown>;
  return (
    typeof record.key === "string" &&
    record.type === "voice" &&
    typeof record.script === "string" &&
    typeof record.scriptSHA256 === "string"
  );
};

export const verifyCustomRendererPlugin = async (plugin: unknown) => {
  if (!isCustomRendererPlugin(plugin)) return false;
  return (
    (await CommonTool.generateSHA256Hash(plugin.script)) ===
    plugin.scriptSHA256
  );
};

export const verifyCustomVoicePlugin = async (plugin: unknown) => {
  if (!isCustomVoicePlugin(plugin)) return false;
  return (
    (await CommonTool.generateSHA256Hash(plugin.script)) ===
    plugin.scriptSHA256.toLowerCase()
  );
};

export const executeCustomTranslation = (
  plugin: CustomRendererPluginRecord
): TranslatePlugin => {
  window.translate = undefined;
  eval(plugin.script);
  if (typeof window.translate !== "function") {
    throw new Error("Invalid custom translation plugin");
  }
  return window.translate;
};

export const executeCustomDictionary = (
  plugin: CustomRendererPluginRecord
): DictionaryPlugin => {
  window.getDictText = undefined;
  eval(plugin.script);
  if (typeof window.getDictText !== "function") {
    throw new Error("Invalid custom dictionary plugin");
  }
  return window.getDictText;
};
