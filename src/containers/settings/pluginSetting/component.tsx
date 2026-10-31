import { useTranslation } from "react-i18next";
import React, { useEffect, useRef, useState } from "react";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import {
  getWebsiteLang,
  getWebsiteUrl,
  handleContextMenu,
  openExternalUrl,
  vexComfirmAsync,
  vexOpenAsync,
} from "../../../utils/common";

import DatabaseService from "../../../utils/storage/databaseService";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import {
  getBuiltinPluginDefinition,
  getBuiltinPluginLocalizedName,
  getBuiltinPluginMarket,
} from "../../../utils/plugins/catalog";
import { createBuiltinPluginRecord } from "../../../utils/plugins/records";
import {
  verifyCustomRendererPlugin,
  isCustomRendererPlugin,
  isCustomVoicePlugin,
  verifyCustomVoicePlugin,
} from "../../../utils/plugins/customPlugin";
import type { PluginConfig, PluginVoice } from "../../../utils/plugins/types";
import { useAppStore } from "../../../store/useAppStore";

import type { BuiltinPluginMarketItem } from "../../../utils/plugins/types";

export interface SettingInfoState {
  isAddNew: boolean;
  availablePlugins: BuiltinPluginMarketItem[];
  expandedPluginKey: string | null;
  activePluginTab: string;
}

const manualVoiceListPluginKeys = new Set([
  "ttsserver-voice-plugin",
  "chatttsui-voice-plugin",
  "chattts-voice-plugin",
  "coquitts-voice-plugin",
]);

const installedTypeOrder: Record<string, number> = {
  translation: 0,
  dictionary: 1,
  voice: 2,
  ocr: 3,
};

const SettingDialog = () => {
  const plugins = useAppStore((s) => s.manager.plugins);
  const handleFetchPlugins = useAppStore((s) => s.handleFetchPlugins);
  const pluginSettingTab = useAppStore((s) => s.manager.pluginSettingTab);
  const handlePluginSettingTab = useAppStore((s) => s.handlePluginSettingTab);
  const { t, i18n } = useTranslation();
  const translationRef = useRef<HTMLDivElement | null>(null);
  const dictionaryRef = useRef<HTMLDivElement | null>(null);
  const ocrRef = useRef<HTMLDivElement | null>(null);
  const voiceRef = useRef<HTMLDivElement | null>(null);

  const getInitialPluginTab = (tab: string) => {
    if (
      (tab === "translation" ||
        tab === "dictionary" ||
        tab === "voice" ||
        tab === "ocr") &&
      !(tab === "voice" && !isElectron)
    ) {
      return tab;
    }
    return "translation";
  };

  const [state, setState] = useState<SettingInfoState>({
    isAddNew: false,
    availablePlugins: [],
    expandedPluginKey: null,
    activePluginTab: getInitialPluginTab(pluginSettingTab),
  });

  const mergeState = (patch: Partial<SettingInfoState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  };

  const getPluginSectionRefMap = (): Record<
    string,
    React.RefObject<HTMLDivElement | null>
  > => ({
    translation: translationRef,
    dictionary: dictionaryRef,
    ocr: ocrRef,
    voice: voiceRef,
  });

  const scrollToPluginSection = (type: string, retries = 20) => {
    const ref = getPluginSectionRefMap()[type]?.current;
    const scrollContainer = document.querySelector(
      ".setting-dialog-info"
    ) as HTMLElement | null;
    if (!ref || !scrollContainer) {
      if (retries > 0) {
        window.setTimeout(() => {
          scrollToPluginSection(type, retries - 1);
        }, 100);
      }
      return;
    }
    const containerRect = scrollContainer.getBoundingClientRect();
    const refRect = ref.getBoundingClientRect();
    const tabBarHeight = 40;
    scrollContainer.scrollTop +=
      refRect.top - containerRect.top - tabBarHeight;
  };

  useEffect(() => {
    if (pluginSettingTab) {
      const nextTab = getInitialPluginTab(pluginSettingTab);
      setState((prev) =>
        nextTab !== prev.activePluginTab
          ? { ...prev, activePluginTab: nextTab }
          : prev
      );
      handlePluginSettingTab("");
      scrollToPluginSection(nextTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pluginSettingTab]);

  const handleGetPluginList = () => {
    const installedPluginKeys = plugins.map((item) => item.key);
    const pluginList = getBuiltinPluginMarket(
      ConfigService.getReaderConfig("lang") || navigator.language
    ).filter((item) => {
      if (!installedPluginKeys.includes(item.plugin.identifier)) {
        if (!isElectron && item.plugin.type === "voice") {
          return false;
        }
        return true;
      }
      return false;
    });
    const typeOrder: Record<string, number> = {
      translation: 0,
      dictionary: 1,
      voice: 2,
      ocr: 3,
    };
    pluginList.sort(
      (a, b) => typeOrder[a.plugin.type] - typeOrder[b.plugin.type]
    );
    mergeState({ availablePlugins: pluginList });
  };
  const getPluginTutorialUrl = () =>
    getWebsiteUrl() + getWebsiteLang() + "/plugin";
  const handleOpenAddNew = async (scrollToTop = false) => {
    if (window.electronAPI?.runtime?.windowsStore) {
      return;
    }
    const result = await vexComfirmAsync("Custom plugin security warning");
    if (!result) return;
    mergeState({ isAddNew: true });
    if (scrollToTop) {
      const infoEl = document.querySelector(".setting-dialog-info");
      if (infoEl) infoEl.scrollTop = 0;
    }
  };
  const handleFillVoiceList = (pluginKey: string, example: PluginVoice[]) =>
    new Promise<PluginVoice[] | false>((resolve) => {
      window.vex.dialog.buttons.YES.text = t("Confirm");
      window.vex.dialog.buttons.NO.text = t("Cancel");
      const placeholder = JSON.stringify(example, null, 2)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      window.vex.dialog.open({
        message: t("Paste voice list JSON"),
        input: `<textarea name="voiceList" placeholder="${placeholder}" style="width:100%;height:320px;resize:vertical;font-family:monospace" required></textarea>`,
        buttons: [
          window.vex.dialog.buttons.YES,
          window.vex.dialog.buttons.NO,
          {
            text: t("Tutorial"),
            type: "button",
            className: "vex-dialog-button-secondary",
            click: () => {
              openExternalUrl(getPluginTutorialUrl());
            },
          },
        ],
        callback: (data) => {
          if (!data) {
            resolve(false);
            return;
          }
          try {
            const voiceList = JSON.parse(data.voiceList);
            if (
              !Array.isArray(voiceList) ||
              voiceList.length === 0 ||
              voiceList.some(
                (voice) =>
                  !voice ||
                  typeof voice !== "object" ||
                  typeof voice.name !== "string" ||
                  !voice.name ||
                  typeof voice.displayName !== "string" ||
                  !voice.displayName ||
                  !voice.config ||
                  typeof voice.config !== "object" ||
                  Array.isArray(voice.config)
              )
            ) {
              throw new Error();
            }
            resolve(
              voiceList.map((voice) => ({
                ...voice,
                plugin: pluginKey,
              }))
            );
          } catch {
            toast.error(t("Invalid voice list JSON"));
            resolve(false);
          }
        },
      });
    });
  const handleFillPluginConfig = async (plugin: any, configuration: string) => {
    if (!plugin || !plugin.config || typeof plugin.config !== "object") {
      return true;
    }
    let config = plugin.config as Record<string, any>;
    let keys = Object.keys(config).filter((key) => key && key.trim());
    if (keys.length === 0) {
      return true;
    }
    let result = await vexOpenAsync(config, configuration || "");
    if (result === false) {
      return false;
    }
    plugin.config = { ...config, ...(result as Record<string, any>) };
    return true;
  };

  useEffect(() => {
    handleGetPluginList();
  }, [plugins]);

  return (
    <>
      {state.isAddNew && (
        <div
          className="voice-add-new-container"
          style={{
            marginLeft: "25px",
            width: "calc(100% - 50px)",
            fontWeight: 500,
          }}
        >
          <textarea
            name="url"
            placeholder={t(
              "Paste the code of the plugin here, check out document to learn how to get more plugins"
            )}
            id="voice-add-content-box"
            className="voice-add-content-box"
            onContextMenu={() => {
              handleContextMenu("voice-add-content-box");
            }}
          />
          <div className="token-dialog-button-container">
            <div
              className="voice-add-confirm"
              onClick={async () => {
                let value: string = (
                  document.querySelector(
                    "#voice-add-content-box"
                  ) as HTMLTextAreaElement
                ).value;
                if (value) {
                  try {
                    const parsed = JSON.parse(value);
                    const plugin = {
                      ...parsed,
                      key: parsed.identifier || parsed.key,
                    };
                    if (plugin.type === "voice" && !isElectron) {
                      toast.error(
                        t("Only desktop version supports TTS plugin")
                      );
                      return;
                    }
                    if (plugin.type === "voice") {
                      if (
                        !isCustomVoicePlugin(plugin) ||
                        !(await verifyCustomVoicePlugin(plugin))
                      ) {
                        toast.error(t("Plugin verification failed"));
                        return;
                      }
                      if (
                        !Array.isArray(plugin.voiceList) ||
                        plugin.voiceList.length === 0
                      ) {
                        try {
                          const voiceList = await window.electronAPI.invoke<
                            PluginVoice[]
                          >("get-tts-voices", {
                            pluginKey: plugin.key,
                            config: plugin.config || {},
                            script: plugin.script,
                            scriptSHA256: plugin.scriptSHA256,
                          });
                          if (
                            !Array.isArray(voiceList) ||
                            voiceList.length === 0 ||
                            voiceList.some(
                              (voice) =>
                                !voice ||
                                typeof voice !== "object" ||
                                typeof voice.name !== "string" ||
                                !voice.name ||
                                typeof voice.displayName !== "string" ||
                                !voice.displayName ||
                                !voice.config ||
                                typeof voice.config !== "object" ||
                                Array.isArray(voice.config)
                            )
                          ) {
                            throw new Error("Invalid voice list");
                          }
                          plugin.voiceList = voiceList.map((voice) => ({
                            ...voice,
                            plugin: plugin.key,
                          }));
                        } catch {
                          toast.error(t("Failed to get TTS voice list"));
                          return;
                        }
                      } else {
                        plugin.voiceList = plugin.voiceList.map(
                          (voice: PluginVoice) => ({
                            ...voice,
                            plugin: plugin.key,
                          })
                        );
                      }
                    } else {
                      if (
                        !isCustomRendererPlugin(plugin) ||
                        !(await verifyCustomRendererPlugin(plugin))
                      ) {
                        toast.error(t("Plugin verification failed"));
                        return;
                      }
                    }
                    if (plugins.find((item) => item.key === plugin.key)) {
                      await DatabaseService.updateRecord(plugin, "plugins");
                    } else {
                      await DatabaseService.saveRecord(plugin, "plugins");
                    }
                    handleFetchPlugins();
                    toast.success(t("Addition successful"));
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : t("Plugin verification failed")
                    );
                    return;
                  }
                }
                mergeState({ isAddNew: false });
              }}
            >
              <Trans>Confirm</Trans>
            </div>
            <div className="voice-add-button-container">
              <div
                className="voice-add-cancel"
                onClick={() => {
                  mergeState({ isAddNew: false });
                }}
              >
                <Trans>Cancel</Trans>
              </div>
              <div
                className="voice-add-cancel"
                style={{ marginRight: "10px" }}
                onClick={() => {
                  openExternalUrl(
                    getWebsiteUrl() + getWebsiteLang() + "/plugin"
                  );
                }}
              >
                <Trans>Document</Trans>
              </div>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          fontWeight: "bold",
          textAlign: "left",
          marginBottom: "20px",
          marginLeft: "30px",
          marginTop: "20px",
        }}
      >
        <span style={{}} onClick={() => handleOpenAddNew(false)}>
          <Trans>Installed</Trans>
        </span>
      </div>

      {plugins &&
        plugins
          .filter((item) => item.type !== "ai")
          .sort(
            (a, b) => installedTypeOrder[a.type] - installedTypeOrder[b.type]
          )
          .map((item) => {
            return (
              <div className="setting-dialog-new-title" key={item.key}>
                <span>
                  <span
                    className={`icon-${
                      item.type === "dictionary"
                        ? "dict"
                        : item.type === "voice"
                          ? "speaker"
                          : item.type === "translation" || item.type === "ocr"
                            ? "translation"
                            : "ai-assist"
                    } setting-plugin-icon`}
                  ></span>
                  <span className="setting-plugin-name">
                    {getBuiltinPluginLocalizedName(item.key, i18n.language) ??
                      t(item.displayName)}
                  </span>
                </span>

                {!item.key.startsWith("official") &&
                  !item.key.startsWith("dict") &&
                  !item.key.startsWith("custom") && (
                    <span
                      className="change-location-button"
                      onClick={async () => {
                        await DatabaseService.deleteRecord(item.key, "plugins");
                        handleFetchPlugins();
                        toast.success(t("Deletion successful"));
                        handleGetPluginList();
                      }}
                    >
                      <Trans>Delete</Trans>
                    </span>
                  )}
              </div>
            );
          })}
      <div
        style={{
          fontWeight: "bold",
          textAlign: "left",
          marginBottom: "20px",
          marginLeft: "30px",
          marginTop: "20px",
        }}
      >
        <span style={{}} onClick={() => handleOpenAddNew(false)}>
          <Trans>Plugin market</Trans>
        </span>
      </div>
      <div className="plugin-tab-bar">
        {(["translation", "dictionary", "voice", "ocr"] as const)
          .filter((type) => isElectron || type !== "voice")
          .map((type) => {
            const labelMap: Record<string, string> = {
              translation: t("Translation"),
              dictionary: t("Dictionary"),
              voice: t("Voice"),
              ocr: t("OCR"),
            };
            return (
              <div
                key={type}
                className={`plugin-tab-item${state.activePluginTab === type ? " plugin-tab-item-active" : ""}`}
                onClick={() => {
                  mergeState({ activePluginTab: type });
                  scrollToPluginSection(type);
                }}
              >
                {labelMap[type]}
              </div>
            );
          })}
      </div>
      {state.availablePlugins &&
        state.availablePlugins.map((item, index: number) => {
          const isExpanded = state.expandedPluginKey === item.plugin.identifier;
          const type = item.plugin.type;
          const prevType =
            index > 0 ? state.availablePlugins[index - 1].plugin.type : null;
          const isFirstOfType = type !== prevType;
          const sectionRef =
            type === "translation"
              ? translationRef
              : type === "dictionary"
                ? dictionaryRef
                : type === "ocr"
                  ? ocrRef
                  : type === "voice"
                    ? voiceRef
                    : null;
          return (
            <div key={item.plugin.identifier}>
              {isFirstOfType && sectionRef && (
                <div ref={sectionRef} className="plugin-section-anchor" />
              )}
              <div className="setting-dialog-new-title">
                <span>
                  <span
                    className={`icon-${
                      item.plugin.type === "dictionary"
                        ? "dict"
                        : item.plugin.type === "voice"
                          ? "speaker"
                          : item.plugin.type === "translation" ||
                              item.plugin.type === "ocr"
                            ? "translation"
                            : "ai-assist"
                    } setting-plugin-icon`}
                  ></span>
                  <span className="setting-plugin-name">{t(item.name)}</span>
                </span>
                <span
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      mergeState({
                        expandedPluginKey: isExpanded
                          ? null
                          : item.plugin.identifier,
                      });
                    }}
                  >
                    <Trans>Details</Trans>
                  </span>

                  <span
                    className="change-location-button"
                    onClick={async () => {
                      const plugin = structuredClone(item.plugin);
                      const pluginKey = plugin.identifier;

                      if (plugin.type === "voice" && !isElectron) {
                        toast.error(
                          t("Only desktop version supports TTS plugin")
                        );
                        return;
                      }

                      if (
                        !(await handleFillPluginConfig(
                          plugin,
                          item.configuration
                        ))
                      ) {
                        return;
                      }
                      let voiceList = plugin.voiceList;
                      if (manualVoiceListPluginKeys.has(pluginKey)) {
                        const configuredVoiceList = await handleFillVoiceList(
                          pluginKey,
                          voiceList
                        );
                        if (configuredVoiceList === false) {
                          return;
                        }
                        voiceList = configuredVoiceList;
                      } else if (
                        plugin.type === "voice" &&
                        voiceList.length === 0
                      ) {
                        try {
                          voiceList = await window.electronAPI.invoke<
                            PluginVoice[]
                          >("get-tts-voices", {
                            pluginKey,
                            config: plugin.config,
                          });
                        } catch (error) {
                          console.error("Failed to get TTS voice list:", error);
                          toast.error(t("Failed to get TTS voice list"));
                          return;
                        }
                      }
                      if (
                        plugins.find((installed) => installed.key === pluginKey)
                      ) {
                        toast.error(t("Plugin already installed"));
                        return;
                      }
                      const definition = getBuiltinPluginDefinition(pluginKey);
                      if (!definition) return;
                      await DatabaseService.saveRecord(
                        createBuiltinPluginRecord(
                          definition,
                          plugin.config as PluginConfig,
                          voiceList
                        ),
                        "plugins"
                      );
                      handleFetchPlugins();
                      toast.success(t("Addition successful"));
                      handleGetPluginList();
                    }}
                  >
                    <Trans>Install</Trans>
                  </span>
                </span>
              </div>
              {isExpanded && (
                <div
                  style={{
                    marginLeft: "30px",
                    marginRight: "30px",
                    marginBottom: "12px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    lineHeight: 1.8,
                    padding: "15px",
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  {item.feature && (
                    <div>
                      <span style={{ fontWeight: "bold" }}>
                        <Trans>Features</Trans>:
                      </span>{" "}
                      {item.feature}
                    </div>
                  )}
                  {item.websiteName && item.websiteUrl && (
                    <div>
                      <span style={{ fontWeight: "bold" }}>
                        <Trans>Website</Trans>:
                      </span>{" "}
                      <span
                        style={{
                          textDecoration: "underline",
                          cursor: "pointer",
                        }}
                        onClick={() => openExternalUrl(item.websiteUrl)}
                      >
                        {item.websiteName}
                      </span>
                    </div>
                  )}
                  {item.configuration && (
                    <div>
                      <span style={{ fontWeight: "bold" }}>
                        <Trans>Configuration</Trans>:
                      </span>{" "}
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          cursor: "text",
                          userSelect: "text",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.configuration}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

      {!window.electronAPI?.runtime?.windowsStore && (
        <div className="setting-dialog-new-plugin">
          <span
            style={{ textDecoration: "underline", marginRight: "20px" }}
            onClick={() => {
              openExternalUrl(getPluginTutorialUrl());
            }}
          >
            <Trans>Visit online version</Trans>
          </span>
          <span
            style={{ textDecoration: "underline" }}
            onClick={() => {
              if (
                ConfigService.getReaderConfig("lang") &&
                ConfigService.getReaderConfig("lang").startsWith("zh")
              ) {
                openExternalUrl(
                  "https://github.com/koodo-reader/plugins/blob/main/README_CN.md"
                );
              } else {
                openExternalUrl(
                  "https://github.com/koodo-reader/plugins/blob/main/README.md"
                );
              }
            }}
          >
            <Trans>How to custom plugin</Trans>
          </span>
          <span
            style={{ marginLeft: "20px", fontWeight: "bold" }}
            onClick={async () => {
              handleOpenAddNew(true);
            }}
          >
            <Trans>Add custom plugin</Trans>
          </span>
        </div>
      )}
    </>
  );
};

export default SettingDialog;
