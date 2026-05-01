import React from "react";
import { SettingInfoProps, SettingInfoState } from "./interface";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import packageJson from "../../../../package.json";

import { getWebsiteUrl, openExternalUrl } from "../../../utils/common";
import copyTextToClipboard from "copy-text-to-clipboard";
import { isElectron } from "react-device-detect";
import { checkDeveloperUpdate } from "../../../utils/request/common";
declare var window: any;

class AboutSetting extends React.Component<SettingInfoProps, SettingInfoState> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <>
        <div className="setting-dialog-new-title">
          <Trans>Current version</Trans>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span>{packageJson.version}</span>

            <span
              className="change-location-button"
              style={{ marginLeft: "10px", cursor: "pointer" }}
              onClick={async () => {
                toast.loading(this.props.t("Checking for update") + "...", {
                  id: "checking_update",
                });
                let res = await checkDeveloperUpdate();
                const newVersion = res.version;
                if (newVersion === packageJson.version) {
                  toast.success(
                    this.props.t("You are using the latest version"),
                    {
                      id: "checking_update",
                    }
                  );
                } else {
                  toast.success(
                    this.props.t("A new version is available") +
                      ": " +
                      newVersion,
                    {
                      id: "checking_update",
                    }
                  );

                  let lang = "en";
                  if (
                    ConfigService.getReaderConfig("lang") &&
                    ConfigService.getReaderConfig("lang").startsWith("zh")
                  ) {
                    lang = "zh";
                  }
                  setTimeout(() => {
                    openExternalUrl(
                      getWebsiteUrl() +
                        "/" +
                        lang +
                        "/download" +
                        "?version=developer"
                    );
                  }, 1000);
                }
              }}
            >
              <Trans>Check for update</Trans>
            </span>
          </div>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Select update channel</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            onChange={(event) => {
              ConfigService.setReaderConfig(
                "updateChannel",
                event.target.value
              );
              toast.success(this.props.t("Change successful"));
            }}
          >
            {[
              { value: "dev", label: "Developer version" },
              { value: "stable", label: "Stable version" },
            ].map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
                selected={
                  item.value === ConfigService.getReaderConfig("updateChannel")
                }
              >
                {this.props.t(item.label)}
              </option>
            ))}
          </select>
        </div>
        {isElectron && (
          <div className="setting-dialog-new-title">
            <Trans>Get debug logs</Trans>
            <span
              className="change-location-button"
              onClick={async () => {
                const { ipcRenderer } = window.require("electron");
                ipcRenderer.invoke("get-debug-logs", "ping");
              }}
            >
              <Trans>Locate</Trans>
            </span>
          </div>
        )}

        {isElectron && (
          <div className="setting-dialog-new-title">
            <Trans>Open console</Trans>
            <span
              className="change-location-button"
              onClick={async () => {
                window
                  .require("electron")
                  .ipcRenderer.invoke("open-console", "ping");
              }}
            >
              <Trans>View</Trans>
            </span>
          </div>
        )}
        <div className="setting-dialog-new-title">
          <Trans>Document</Trans>

          <span
            className="change-location-button"
            onClick={async () => {
              if (
                ConfigService.getReaderConfig("lang") &&
                ConfigService.getReaderConfig("lang").startsWith("zh")
              ) {
                openExternalUrl(getWebsiteUrl() + "/zh/document");
              } else {
                openExternalUrl(getWebsiteUrl() + "/en/document");
              }
            }}
          >
            <Trans>Visit</Trans>
          </span>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Support</Trans>

          <span
            className="change-location-button"
            onClick={async () => {
              if (
                ConfigService.getReaderConfig("lang") &&
                ConfigService.getReaderConfig("lang").startsWith("zh")
              ) {
                openExternalUrl(getWebsiteUrl() + "/zh/support");
              } else {
                openExternalUrl(getWebsiteUrl() + "/en/support");
              }
            }}
          >
            <Trans>Visit</Trans>
          </span>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Shortcuts</Trans>

          <span
            className="change-location-button"
            onClick={async () => {
              if (
                ConfigService.getReaderConfig("lang") &&
                ConfigService.getReaderConfig("lang").startsWith("zh")
              ) {
                openExternalUrl(getWebsiteUrl() + "/zh/use-shortcut");
              } else {
                openExternalUrl(getWebsiteUrl() + "/en/use-shortcut");
              }
            }}
          >
            <Trans>Visit</Trans>
          </span>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Our website</Trans>

          <span
            className="change-location-button"
            onClick={() => {
              openExternalUrl(getWebsiteUrl());
            }}
          >
            <Trans>Visit</Trans>
          </span>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Send email</Trans>

          <span
            className="change-location-button"
            onClick={() => {
              copyTextToClipboard("feedback@koodoreader.com");
              toast.success(this.props.t("Email copied to clipboard"));
            }}
          >
            <Trans>Copy</Trans>
          </span>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Translation</Trans>

          <span
            className="change-location-button"
            onClick={() => {
              openExternalUrl(
                "https://github.com/koodo-reader/koodo-reader#translation"
              );
            }}
          >
            <Trans>Visit</Trans>
          </span>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>GitHub repository</Trans>

          <span
            className="change-location-button"
            onClick={() => {
              openExternalUrl("https://github.com/koodo-reader/koodo-reader");
            }}
          >
            <Trans>Visit</Trans>
          </span>
        </div>
      </>
    );
  }
}

export default AboutSetting;
