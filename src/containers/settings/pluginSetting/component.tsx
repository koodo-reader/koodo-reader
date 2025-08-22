import React from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import _ from "underscore";
import { themeList } from "../../../constants/themeList";
import toast from "react-hot-toast";
import {
  checkPlugin,
  handleContextMenu,
  openExternalUrl,
  WEBSITE_URL,
} from "../../../utils/common";
import { getStorageLocation } from "../../../utils/common";
import DatabaseService from "../../../utils/storage/databaseService";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { isElectron } from "react-device-detect";
declare var global: any;
class SettingDialog extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {
      isPreventTrigger:
        ConfigService.getReaderConfig("isPreventTrigger") === "yes",
      isPreventAdd: ConfigService.getReaderConfig("isPreventAdd") === "yes",
      isLemmatizeWord:
        ConfigService.getReaderConfig("isLemmatizeWord") === "yes",
      isOpenBook: ConfigService.getReaderConfig("isOpenBook") === "yes",
      isDisablePopup: ConfigService.getReaderConfig("isDisablePopup") === "yes",
      isDeleteShelfBook:
        ConfigService.getReaderConfig("isDeleteShelfBook") === "yes",
      isHideShelfBook:
        ConfigService.getReaderConfig("isHideShelfBook") === "yes",
      isOpenInMain: ConfigService.getReaderConfig("isOpenInMain") === "yes",
      isDisableUpdate:
        ConfigService.getReaderConfig("isDisableUpdate") === "yes",
      isPrecacheBook: ConfigService.getReaderConfig("isPrecacheBook") === "yes",
      appSkin: ConfigService.getReaderConfig("appSkin"),
      isUseBuiltIn: ConfigService.getReaderConfig("isUseBuiltIn") === "yes",
      isDisablePDFCover:
        ConfigService.getReaderConfig("isDisablePDFCover") === "yes",
      currentThemeIndex: _.findLastIndex(themeList, {
        name: ConfigService.getReaderConfig("themeColor"),
      }),
      storageLocation: getStorageLocation() || "",
      isAddNew: false,
      settingLogin: "",
      driveConfig: {},
      loginConfig: {},
    };
  }

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
  render() {
    return (
      <>
        {this.props.plugins &&
          (this.props.plugins.length === 0 || this.state.isAddNew) && (
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
                          this.props.t(
                            "Only desktop version supports TTS plugin"
                          )
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
                        openExternalUrl(WEBSITE_URL + "/zh/plugin");
                      } else {
                        openExternalUrl(WEBSITE_URL + "/en/plugin");
                      }
                    }}
                  >
                    <Trans>Document</Trans>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                    }}
                  >
                    <Trans>Delete</Trans>
                  </span>
                )}
              </div>
            );
          })}

        {this.props.plugins && this.props.plugins.length > 0 && (
          <div
            className="setting-dialog-new-plugin"
            onClick={async () => {
              this.setState({ isAddNew: true });
            }}
          >
            <Trans>Add new plugin</Trans>
          </div>
        )}
      </>
    );
  }
}

export default SettingDialog;
