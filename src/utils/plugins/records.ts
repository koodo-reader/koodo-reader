import PluginModel from "../../models/Plugin";
import { getBuiltinPluginDefinition } from "./catalog";
import {
  isCustomRendererPlugin,
  verifyCustomRendererPlugin,
} from "./customPlugin";
import type {
  BuiltinPluginDefinition,
  BuiltinPluginRecord,
  PluginConfig,
  PluginVoice,
} from "./types";

const asConfig = (value: unknown): PluginConfig =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as PluginConfig)
    : {};

const asVoiceList = (value: unknown): PluginVoice[] =>
  Array.isArray(value) ? (value as PluginVoice[]) : [];

export const createBuiltinPluginRecord = (
  definition: BuiltinPluginDefinition,
  config: PluginConfig,
  voiceList: PluginVoice[]
): BuiltinPluginRecord => ({
  key: definition.key,
  type: definition.type,
  displayName: definition.displayName,
  icon: definition.icon,
  version: definition.version,
  config,
  autoValue: definition.autoValue,
  langList: definition.langList,
  voiceList,
  scriptSHA256: "",
  script: "",
});

export const resolveBuiltinPlugin = (
  definition: BuiltinPluginDefinition,
  record: Record<string, unknown>
) =>
  new PluginModel(
    definition.key,
    definition.type,
    definition.displayName,
    definition.icon,
    definition.version,
    definition.autoValue,
    asConfig(record.config),
    definition.langList,
    asVoiceList(record.voiceList).length > 0
      ? asVoiceList(record.voiceList)
      : definition.voiceList
  );

export const resolveStoredPlugin = async (record: unknown) => {
  if (!record || typeof record !== "object") return undefined;
  const stored = record as Record<string, unknown>;
  const key =
    typeof stored.key === "string"
      ? stored.key
      : typeof stored.identifier === "string"
        ? stored.identifier
        : "";
  if (!key) return undefined;

  const definition = getBuiltinPluginDefinition(key);
  if (definition) return resolveBuiltinPlugin(definition, stored);

  const custom = { ...stored, key };
  if (
    isCustomRendererPlugin(custom) &&
    (await verifyCustomRendererPlugin(custom))
  ) {
    return new PluginModel(
      custom.key,
      custom.type,
      custom.displayName,
      custom.icon,
      custom.version,
      custom.autoValue,
      custom.config,
      custom.langList,
      [],
      custom.scriptSHA256,
      custom.script
    );
  }

  return undefined;
};
