import React from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import _ from "underscore";

import toast from "react-hot-toast";
import {
  getWebsiteUrl,
  handleContextMenu,
  openExternalUrl,
  vexOpenAsync,
} from "../../../utils/common";

import DatabaseService from "../../../utils/storage/databaseService";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import {
  getBuiltinPluginDefinition,
  getBuiltinPluginMarket,
} from "../../../utils/plugins/catalog";
import { createBuiltinPluginRecord } from "../../../utils/plugins/records";
import {
  verifyCustomRendererPlugin,
  isCustomRendererPlugin,
} from "../../../utils/plugins/customPlugin";
import type { PluginConfig, PluginVoice } from "../../../utils/plugins/types";

const manualVoiceListPluginKeys = new Set([
  "ttsserver-voice-plugin",
  "chatttsui-voice-plugin",
  "chattts-voice-plugin",
  "coquitts-voice-plugin",
]);

class SettingDialog extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  private translationRef = React.createRef<HTMLDivElement>();
  private dictionaryRef = React.createRef<HTMLDivElement>();
  private voiceRef = React.createRef<HTMLDivElement>();

  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      isAddNew: false,
      availablePlugins: [],
      expandedPluginKey: null,
      activePluginTab: "translation",
    };
  }
  componentDidMount() {
    this.handleGetPluginList();
  }
  handleGetPluginList = () => {
    const installedPluginKeys = this.props.plugins.map((item) => item.key);
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
    };
    pluginList.sort(
      (a, b) => typeOrder[a.plugin.type] - typeOrder[b.plugin.type]
    );
    this.setState({ availablePlugins: pluginList });
  };
  getPluginTutorialUrl = () =>
    getWebsiteUrl() +
    (ConfigService.getReaderConfig("lang")?.startsWith("zh")
      ? "/zh/plugin"
      : "/en/plugin");
  handleFillVoiceList = (pluginKey: string, example: PluginVoice[]) =>
    new Promise<PluginVoice[] | false>((resolve) => {
      window.vex.dialog.buttons.YES.text = this.props.t("Confirm");
      window.vex.dialog.buttons.NO.text = this.props.t("Cancel");
      const placeholder = JSON.stringify(example, null, 2)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      window.vex.dialog.open({
        message: this.props.t("Paste voice list JSON"),
        input: `<textarea name="voiceList" placeholder="${placeholder}" style="width:100%;height:320px;resize:vertical;font-family:monospace" required></textarea>`,
        buttons: [
          window.vex.dialog.buttons.YES,
          window.vex.dialog.buttons.NO,
          {
            text: this.props.t("Tutorial"),
            type: "button",
            className: "vex-dialog-button-secondary",
            click: () => {
              openExternalUrl(this.getPluginTutorialUrl());
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
            toast.error(this.props.t("Invalid voice list JSON"));
            resolve(false);
          }
        },
      });
    });
  handleFillPluginConfig = async (plugin: any, configuration: string) => {
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
  render() {
    return (
      <>
        {this.state.isAddNew && (
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
              placeholder={this.props.t(
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
                      if (parsed?.type === "voice") {
                        toast.error(
                          this.props.t("Custom voice plugins are not supported")
                        );
                        return;
                      }
                      const plugin = {
                        ...parsed,
                        key: parsed.identifier || parsed.key,
                      };
                      if (
                        !isCustomRendererPlugin(plugin) ||
                        !(await verifyCustomRendererPlugin(plugin))
                      ) {
                        toast.error(this.props.t("Plugin verification failed"));
                        return;
                      }
                      if (
                        this.props.plugins.find(
                          (item) => item.key === plugin.key
                        )
                      ) {
                        await DatabaseService.updateRecord(plugin, "plugins");
                      } else {
                        await DatabaseService.saveRecord(plugin, "plugins");
                      }
                      this.props.handleFetchPlugins();
                      toast.success(this.props.t("Addition successful"));
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : this.props.t("Plugin verification failed")
                      );
                      return;
                    }
                  }
                  this.setState({ isAddNew: false });
                }}
              >
                <Trans>Confirm</Trans>
              </div>
              <div className="voice-add-button-container">
                <div
                  className="voice-add-cancel"
                  onClick={() => {
                    this.setState({ isAddNew: false });
                  }}
                >
                  <Trans>Cancel</Trans>
                </div>
                <div
                  className="voice-add-cancel"
                  style={{ marginRight: "10px" }}
                  onClick={() => {
                    if (
                      ConfigService.getReaderConfig("lang") &&
                      ConfigService.getReaderConfig("lang").startsWith("zh")
                    ) {
                      openExternalUrl(getWebsiteUrl() + "/zh/plugin");
                    } else {
                      openExternalUrl(getWebsiteUrl() + "/en/plugin");
                    }
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
          <span
            style={{}}
            onClick={async () => {
              this.setState({ isAddNew: true });
            }}
          >
            <Trans>Installed</Trans>
          </span>
        </div>

        {this.props.plugins &&
          this.props.plugins
            .filter((item) => item.type !== "ai")
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
                            : item.type === "translation"
                              ? "translation"
                              : "ai-assist"
                      } setting-plugin-icon`}
                    ></span>
                    <span className="setting-plugin-name">
                      {this.props.t(item.displayName)}
                    </span>
                  </span>

                  {!item.key.startsWith("official") &&
                    !item.key.startsWith("dict") &&
                    !item.key.startsWith("custom") && (
                      <span
                        className="change-location-button"
                        onClick={async () => {
                          await DatabaseService.deleteRecord(
                            item.key,
                            "plugins"
                          );
                          this.props.handleFetchPlugins();
                          toast.success(this.props.t("Deletion successful"));
                          this.handleGetPluginList();
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
          <span
            style={{}}
            onClick={async () => {
              this.setState({ isAddNew: true });
            }}
          >
            <Trans>Plugin market</Trans>
          </span>
        </div>
        <div className="plugin-tab-bar">
          {(["translation", "dictionary", "voice"] as const)
            .filter((type) => isElectron || type !== "voice")
            .map((type) => {
              const labelMap: Record<string, string> = {
                translation: this.props.t("Translation"),
                dictionary: this.props.t("Dictionary"),
                voice: this.props.t("Voice"),
              };
              const refMap: Record<string, React.RefObject<HTMLDivElement>> = {
                translation: this.translationRef,
                dictionary: this.dictionaryRef,
                voice: this.voiceRef,
              };
            return (
              <div
                key={type}
                className={`plugin-tab-item${this.state.activePluginTab === type ? " plugin-tab-item-active" : ""}`}
                onClick={() => {
                  this.setState({ activePluginTab: type });
                  const ref = refMap[type].current;
                  if (ref) {
                    const scrollContainer = document.querySelector(
                      ".setting-dialog-info"
                    ) as HTMLElement;
                    if (scrollContainer) {
                      const containerRect =
                        scrollContainer.getBoundingClientRect();
                      const refRect = ref.getBoundingClientRect();
                      const tabBarHeight = 40;
                      scrollContainer.scrollTop +=
                        refRect.top - containerRect.top - tabBarHeight;
                    }
                  }
                }}
              >
                {labelMap[type]}
              </div>
            );
          })}
        </div>
        {this.state.availablePlugins &&
          this.state.availablePlugins.map((item, index: number) => {
            const isExpanded =
              this.state.expandedPluginKey === item.plugin.identifier;
            const type = item.plugin.type;
            const prevType =
              index > 0
                ? this.state.availablePlugins[index - 1].plugin.type
                : null;
            const isFirstOfType = type !== prevType;
            const sectionRef =
              type === "translation"
                ? this.translationRef
                : type === "dictionary"
                  ? this.dictionaryRef
                  : type === "voice"
                    ? this.voiceRef
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
                            : item.plugin.type === "translation"
                              ? "translation"
                              : "ai-assist"
                      } setting-plugin-icon`}
                    ></span>
                    <span className="setting-plugin-name">
                      {this.props.t(item.name)}
                    </span>
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
                        this.setState({
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
                            this.props.t(
                              "Only desktop version supports TTS plugin"
                            )
                          );
                          return;
                        }

                        if (
                          !(await this.handleFillPluginConfig(
                            plugin,
                            item.configuration
                          ))
                        ) {
                          return;
                        }
                        let voiceList = plugin.voiceList;
                        if (manualVoiceListPluginKeys.has(pluginKey)) {
                          const configuredVoiceList =
                            await this.handleFillVoiceList(
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
                            console.error(
                              "Failed to get TTS voice list:",
                              error
                            );
                            toast.error(
                              this.props.t("Failed to get TTS voice list")
                            );
                            return;
                          }
                        }
                        if (
                          this.props.plugins.find(
                            (installed) => installed.key === pluginKey
                          )
                        ) {
                          toast.error(this.props.t("Plugin already installed"));
                          return;
                        }
                        const definition =
                          getBuiltinPluginDefinition(pluginKey);
                        if (!definition) return;
                        await DatabaseService.saveRecord(
                          createBuiltinPluginRecord(
                            definition,
                            plugin.config as PluginConfig,
                            voiceList
                          ),
                          "plugins"
                        );
                        this.props.handleFetchPlugins();
                        toast.success(this.props.t("Addition successful"));
                        this.handleGetPluginList();
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

        <div className="setting-dialog-new-plugin">
          <span
            style={{ textDecoration: "underline", marginRight: "20px" }}
            onClick={() => {
              openExternalUrl(this.getPluginTutorialUrl());
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
              const infoEl = document.querySelector(".setting-dialog-info");
              this.setState({ isAddNew: true }, () => {
                if (infoEl) infoEl.scrollTop = 0;
              });
            }}
          >
            <Trans>Add custom plugin</Trans>
          </span>
        </div>
      </>
    );
  }
}

export default SettingDialog;
