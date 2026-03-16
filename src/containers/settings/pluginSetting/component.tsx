import React from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import _ from "underscore";
import { themeList } from "../../../constants/themeList";
import toast from "react-hot-toast";
import {
  checkPlugin,
  getWebsiteUrl,
  handleContextMenu,
  openExternalUrl,
  vexOpenAsync,
} from "../../../utils/common";
import { getStorageLocation } from "../../../utils/common";
import DatabaseService from "../../../utils/storage/databaseService";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
import { getPluginList } from "../../../utils/request/common";
declare var global: any;
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
      isPreventTrigger:
        ConfigService.getReaderConfig("isPreventTrigger") === "yes",
      isPreventAdd: ConfigService.getReaderConfig("isPreventAdd") === "yes",
      isDisablePopup: ConfigService.getReaderConfig("isDisablePopup") === "yes",
      isDeleteShelfBook:
        ConfigService.getReaderConfig("isDeleteShelfBook") === "yes",
      isHideShelfBook:
        ConfigService.getReaderConfig("isHideShelfBook") === "yes",
      isOpenInMain: ConfigService.getReaderConfig("isOpenInMain") === "yes",
      isPrecacheBook: ConfigService.getReaderConfig("isPrecacheBook") === "yes",
      appSkin: ConfigService.getReaderConfig("appSkin"),
      isDisablePDFCover:
        ConfigService.getReaderConfig("isDisablePDFCover") === "yes",
      currentThemeIndex: themeList.findIndex(
        (item) =>
          item.color ===
          (ConfigService.getReaderConfig("themeColor") || "default")
      ),
      storageLocation: getStorageLocation() || "",
      isAddNew: false,
      settingLogin: "",
      driveConfig: {},
      loginConfig: {},
      availablePlugins: [],
      expandedPluginKey: null,
      activePluginTab: "translation",
    };
  }
  componentDidMount() {
    this.handleGetPluginList();
  }
  handleGetPluginList = async () => {
    let plugins = await getPluginList();
    if (plugins) {
      let installedPluginKeys = this.props.plugins.map((item) => item.key);
      let pluginList = plugins.filter(
        (item: any) => !installedPluginKeys.includes(item.plugin.identifier)
      );
      const typeOrder: Record<string, number> = {
        translation: 0,
        dictionary: 1,
        voice: 2,
      };
      pluginList.sort((a: any, b: any) => {
        const aOrder =
          typeOrder[a.plugin.type] !== undefined
            ? typeOrder[a.plugin.type]
            : 99;
        const bOrder =
          typeOrder[b.plugin.type] !== undefined
            ? typeOrder[b.plugin.type]
            : 99;
        return aOrder - bOrder;
      });
      this.setState({ availablePlugins: pluginList });
    }
  };
  handleRest = (_bool: boolean) => {
    toast.success(this.props.t("Change successful"));
  };
  handleSetting = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any);
    ConfigService.setReaderConfig(
      stateName,
      this.state[stateName] ? "no" : "yes"
    );
    this.handleRest(this.state[stateName]);
  };
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
                    let plugin = JSON.parse(value);
                    plugin.key = plugin.identifier;
                    if (!(await checkPlugin(plugin))) {
                      toast.error(this.props.t("Plugin verification failed"));
                      return;
                    }

                    if (plugin.type === "voice" && !isElectron) {
                      toast.error(
                        this.props.t("Only desktop version supports TTS plugin")
                      );
                      return;
                    }
                    if (
                      plugin.type === "voice" &&
                      plugin.voiceList.length === 0
                    ) {
                      let voiceFunc = plugin.script;
                      // eslint-disable-next-line no-eval
                      eval(voiceFunc);
                      plugin.voiceList = await global.getTTSVoice(
                        plugin.config
                      );
                    }
                    if (
                      this.props.plugins.find((item) => item.key === plugin.key)
                    ) {
                      await DatabaseService.updateRecord(plugin, "plugins");
                    } else {
                      await DatabaseService.saveRecord(plugin, "plugins");
                    }
                    this.props.handleFetchPlugins();
                    toast.success(this.props.t("Addition successful"));
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
          this.props.plugins.map((item) => {
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

                {!item.key.startsWith("official") && (
                  <span
                    className="change-location-button"
                    onClick={async () => {
                      await DatabaseService.deleteRecord(item.key, "plugins");
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
          {(["translation", "dictionary", "voice"] as const).map((type) => {
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
          this.state.availablePlugins.map((item: any, index: number) => {
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
              <div key={item.plugin.key}>
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
                      {this.props.t(item.plugin.displayName)}
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
                        let plugin = item.plugin;
                        plugin.key = plugin.identifier;

                        if (plugin.type === "voice" && !isElectron) {
                          toast.error(
                            this.props.t(
                              "Only desktop version supports TTS plugin"
                            )
                          );
                          return;
                        }

                        if (
                          plugin.type === "voice" &&
                          plugin.voiceList.length > 0
                        ) {
                          toast.loading(
                            this.props.t(
                              "Please visit the documentation to learn how to install this plugin. Your browser will automatically open in 5 seconds"
                            ),
                            {
                              duration: 5000,
                              id: "plugin-installation",
                            }
                          );
                          await new Promise((resolve) =>
                            setTimeout(resolve, 5000)
                          );
                          toast.dismiss("plugin-installation");
                          if (
                            ConfigService.getReaderConfig("lang") &&
                            ConfigService.getReaderConfig("lang").startsWith(
                              "zh"
                            )
                          ) {
                            openExternalUrl(getWebsiteUrl() + "/zh/plugin");
                          } else {
                            openExternalUrl(getWebsiteUrl() + "/en/plugin");
                          }
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
                        if (
                          plugin.type === "voice" &&
                          plugin.voiceList.length === 0
                        ) {
                          try {
                            let voiceFunc = plugin.script;
                            // eslint-disable-next-line no-eval
                            eval(voiceFunc);
                            plugin.voiceList = await global.getTTSVoice(
                              plugin.config
                            );
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
                            (installed) => installed.key === plugin.key
                          )
                        ) {
                          toast.error(this.props.t("Plugin already installed"));
                          return;
                        }
                        await DatabaseService.saveRecord(plugin, "plugins");
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
