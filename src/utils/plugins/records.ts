import PluginModel from "../../models/Plugin";
import {
  getBuiltinPluginDefinition,
  isBuiltinPluginKey,
} from "./catalog";
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
  config,
  ...(voiceList.length > 0 ? { voiceList } : {}),
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

export const sanitizeBuiltinPluginRecord = (record: unknown) => {
  if (!record || typeof record !== "object") return undefined;
  const stored = record as Record<string, unknown>;
  const key =
    typeof stored.key === "string"
      ? stored.key
      : typeof stored.identifier === "string"
        ? stored.identifier
        : "";
  if (!isBuiltinPluginKey(key)) return undefined;
  const definition = getBuiltinPluginDefinition(key);
  if (!definition) return undefined;
  return createBuiltinPluginRecord(
    definition,
    asConfig(stored.config),
    asVoiceList(stored.voiceList)
  );
};

const isSanitizedBuiltinRecord = (
  record: unknown,
  sanitized: BuiltinPluginRecord
) => {
  if (!record || typeof record !== "object") return false;
  const stored = record as Record<string, unknown>;
  const legacyFields = [
    "identifier",
    "type",
    "displayName",
    "icon",
    "version",
    "autoValue",
    "langList",
    "scriptSHA256",
    "script",
  ];
  return (
    stored.key === sanitized.key &&
    JSON.stringify(asConfig(stored.config)) ===
      JSON.stringify(sanitized.config) &&
    JSON.stringify(asVoiceList(stored.voiceList)) ===
      JSON.stringify(sanitized.voiceList || []) &&
    legacyFields.every((field) => stored[field] == null)
  );
};

export const sanitizeStoredPluginRecords = (records: unknown[]) => {
  const changedIndexes: number[] = [];
  const sanitizedRecords = records.map((record, index) => {
    const builtin = sanitizeBuiltinPluginRecord(record);
    if (!builtin) return record;
    if (!isSanitizedBuiltinRecord(record, builtin)) {
      changedIndexes.push(index);
    }
    return builtin;
  });
  return {
    records: sanitizedRecords,
    changed: changedIndexes.length > 0,
    changedIndexes,
  };
};
