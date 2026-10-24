import { useEffect, useRef } from "react";
import "./settingDialog.css";
import { SettingInfoProps } from "./interface";
import { Trans } from "react-i18next";
import GeneralSetting from "../../../containers/settings/generalSetting";
import SyncSetting from "../../../containers/settings/syncSetting";
import AccountSetting from "../../../containers/settings/accountSetting";
import PluginSetting from "../../../containers/settings/pluginSetting";
import ReadingSetting from "../../../containers/settings/readingSetting";
import AppearanceSetting from "../../../containers/settings/appearanceSetting";
import AboutSetting from "../../../containers/settings/aboutSetting";
import DataSetting from "../../../containers/settings/dataSetting";
import AISetting from "../../../containers/settings/aiSetting";
import BackgroundSetting from "../../../containers/settings/backgroundSetting";
import FontSetting from "../../../containers/settings/fontSetting";
import ChapterSetting from "../../../containers/settings/chapterSetting";
import TextSetting from "../../../containers/settings/textSetting";
import DictSetting from "../../../containers/settings/dictSetting";
import MoreSetting from "../../../containers/settings/moreSetting";
import ShortcutSetting from "../../../containers/settings/shortcutSetting";
import { isElectron } from "react-device-detect";
const SettingDialog = (props: SettingInfoProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    props.handleFetchPlugins();
    props.handleFetchDataSourceList();
    props.handleFetchDefaultSyncOption();
  }, []);

  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [props.settingMode]);

  const renderSidebarItem = (
    mode: string,
    iconClass: string,
    labelKey: string,
    fontSize: string
  ) => {
    const isActive = props.settingMode === mode;
    return (
      <div
        className={"setting-dialog-sidebar-item" + (isActive ? " active" : "")}
        onClick={() => {
          props.handleSettingMode(mode);
        }}
      >
        <span
          className={"setting-dialog-sidebar-icon " + iconClass}
          style={fontSize ? { fontSize } : {}}
        ></span>
        <Trans>{labelKey}</Trans>
      </div>
    );
  };

  const getCurrentPageTitle = () => {
    switch (props.settingMode) {
      case "general":
        return "General";
      case "reading":
        return "Reading";
      case "shortcut":
        return "Shortcuts";
      case "appearance":
        return "Appearance";
      case "plugins":
        return "Plugins";
      case "sync":
        return "Sync and backup";
      case "account":
        return "Account";
      case "about":
        return "About";
      case "ai":
        return "AI service";
      case "background":
        return "Background";
      case "font":
        return "Font management";
      case "chapter":
        return "TXT parser";
      case "text":
        return "Text rules";
      case "dict":
        return "Local dictionary";
      case "more":
        return "More settings";
      default:
        return "Setting";
    }
  };

  return (
      <div className="setting-dialog-container">
        {/* 左侧导航�?*/}
        <div className="setting-dialog-sidebar">
          <div className="setting-dialog-sidebar-title">
            <Trans>Setting</Trans>
          </div>

          {/* 第一�?*/}
          <div className="setting-dialog-sidebar-group">
            {renderSidebarItem("account", "icon-user", "Account", "18px")}
            {renderSidebarItem("general", "icon-setting", "General", "")}
            {renderSidebarItem("data", "icon-archive", "Data", "15px")}
            {renderSidebarItem(
              "reading",
              "icon-bookshelf-line",
              "Reading",
              ""
            )}
            {renderSidebarItem(
              "shortcut",
              "icon-keyboard",
              "Shortcuts",
              ""
            )}
            {renderSidebarItem(
              "appearance",
              "icon-highlight-line",
              "Appearance",
              "20px"
            )}

            {renderSidebarItem("sync", "icon-sync", "Sync and backup", "")}
            {renderSidebarItem(
              "more",
              "icon-more",
              "More settings",
              "13px"
            )}
            {renderSidebarItem("about", "icon-detail", "About", "18px")}
          </div>

          <hr className="setting-dialog-sidebar-divider" />

          {/* 第二�?*/}
          <div className="setting-dialog-sidebar-group">
            {renderSidebarItem("plugins", "icon-internet", "Plugins", "")}
            {renderSidebarItem(
              "ai",
              "icon-idea-line",
              "AI service",
              "18px"
            )}
            {renderSidebarItem(
              "background",
              "icon-image",
              "Background",
              "18px"
            )}
            {renderSidebarItem(
              "font",
              "icon-font",
              "Font management",
              "18px"
            )}
            {renderSidebarItem(
              "chapter",
              "icon-convert-text",
              "TXT parser",
              "19px"
            )}
            {renderSidebarItem(
              "text",
              "icon-edit-line",
              "Text rules",
              "18px"
            )}
            {isElectron &&
              renderSidebarItem(
                "dict",
                "icon-address-book",
                "Local dictionary",
                "18px"
              )}
          </div>
        </div>

        {/* 右侧主内容区 */}
        <div className="setting-dialog-main">
          <div className="setting-dialog-main-header">
            <Trans>{getCurrentPageTitle()}</Trans>
          </div>

          <div
            className="setting-close-container"
            onClick={() => {
              props.handleSetting(false);
              props.handleSettingMode("general");
            }}
          >
            <span className="icon-close setting-close"></span>
          </div>

          <div className="setting-dialog-info" ref={contentRef}>
            {props.settingMode === "general" ? (
              <GeneralSetting />
            ) : props.settingMode === "reading" ? (
              <ReadingSetting />
            ) : props.settingMode === "shortcut" ? (
              <ShortcutSetting />
            ) : props.settingMode === "appearance" ? (
              <AppearanceSetting />
            ) : props.settingMode === "sync" ? (
              <SyncSetting />
            ) : props.settingMode === "account" ? (
              <AccountSetting />
            ) : props.settingMode === "data" ? (
              <DataSetting />
            ) : props.settingMode === "about" ? (
              <AboutSetting />
            ) : props.settingMode === "ai" ? (
              <AISetting />
            ) : props.settingMode === "background" ? (
              <BackgroundSetting />
            ) : props.settingMode === "font" ? (
              <FontSetting />
            ) : props.settingMode === "chapter" ? (
              <ChapterSetting />
            ) : props.settingMode === "text" ? (
              <TextSetting />
            ) : props.settingMode === "dict" ? (
              <DictSetting />
            ) : props.settingMode === "more" ? (
              <MoreSetting />
            ) : (
              <PluginSetting />
            )}
          </div>
        </div>
      </div>
  );
};

export default SettingDialog;
