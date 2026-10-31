import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import packageJson from "../../../../package.json";

import {
  getWebsiteLang,
  getWebsiteUrl,
  openExternalUrl,
} from "../../../utils/common";
import copyTextToClipboard from "copy-text-to-clipboard";
import { isElectron } from "react-device-detect";
import { checkDeveloperUpdate } from "../../../utils/request/common";

declare var window: any;

const AboutSetting = () => {
  const { t } = useTranslation();
  const [updateChannel, setUpdateChannel] = useState(
    ConfigService.getReaderConfig("updateChannel")
  );

  return (
    <>
      <div className="setting-dialog-new-title">
        <Trans>Current version</Trans>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span>{packageJson.version}</span>

          {isElectron && !window.electronAPI?.runtime?.windowsStore && (
            <span
              className="change-location-button"
              style={{ marginLeft: "10px", cursor: "pointer" }}
              onClick={async () => {
                toast.loading(t("Checking for update") + "...", {
                  id: "checking_update",
                });
                let res = await checkDeveloperUpdate();
                const newVersion = res.version;
                if (newVersion === packageJson.version) {
                  toast.success(t("You are using the latest version"), {
                    id: "checking_update",
                  });
                } else {
                  toast.success(
                    t("A new version is available") + ": " + newVersion,
                    {
                      id: "checking_update",
                    }
                  );
                  setTimeout(() => {
                    openExternalUrl(
                      getWebsiteUrl() +
                        getWebsiteLang() +
                        "/download" +
                        "?version=developer"
                    );
                  }, 1000);
                }
              }}
            >
              <Trans>Check for update</Trans>
            </span>
          )}
        </div>
      </div>
      <div className="setting-dialog-new-title">
        <Trans>Select update channel</Trans>
        <select
          name=""
          className="lang-setting-dropdown"
          value={updateChannel}
          onChange={(event) => {
            ConfigService.setReaderConfig("updateChannel", event.target.value);
            setUpdateChannel(event.target.value);
            toast.success(t("Change successful"));
          }}
        >
          {[
            { value: "", label: "Please select" },
            { value: "dev", label: "Developer version" },
            { value: "stable", label: "Stable version" },
          ].map((item) => (
            <option
              value={item.value}
              key={item.value}
              className="lang-setting-option"
            >
              {t(item.label)}
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
              const ipcRenderer = window.electronAPI;
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
              window.electronAPI.invoke("open-console", "ping");
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
            openExternalUrl(getWebsiteUrl() + getWebsiteLang() + "/document");
          }}
        >
          <Trans>Visit</Trans>
        </span>
      </div>
      <div className="setting-dialog-new-title">
        <Trans>FAQ</Trans>

        <span
          className="change-location-button"
          onClick={async () => {
            openExternalUrl(getWebsiteUrl() + getWebsiteLang() + "/faq");
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
            openExternalUrl(getWebsiteUrl() + getWebsiteLang() + "/support");
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
            openExternalUrl(
              getWebsiteUrl() + getWebsiteLang() + "/use-shortcut"
            );
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
            toast.success(t("Email copied to clipboard"));
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
};

export default AboutSetting;
