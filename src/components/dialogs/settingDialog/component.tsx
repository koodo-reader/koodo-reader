import React from "react";
import "./settingDialog.css";
import { SettingInfoProps, SettingInfoState } from "./interface";
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
class SettingDialog extends React.Component<
  SettingInfoProps,
  SettingInfoState
> {
  constructor(props: SettingInfoProps) {
    super(props);
    this.state = {};
  }
  componentDidMount(): void {
    this.props.handleFetchPlugins();
    this.props.handleFetchDataSourceList();
    this.props.handleFetchDefaultSyncOption();
  }

  renderSidebarItem = (
    mode: string,
    iconClass: string,
    labelKey: string,
    fontSize: string
  ) => {
    const isActive = this.props.settingMode === mode;
    return (
      <div
        className={"setting-dialog-sidebar-item" + (isActive ? " active" : "")}
        onClick={() => {
          this.props.handleSettingMode(mode);
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

  getCurrentPageTitle = () => {
    switch (this.props.settingMode) {
      case "general":
        return "General";
      case "reading":
        return "Reading";
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
      default:
        return "Setting";
    }
  };

  render() {
    return (
      <div className="setting-dialog-container">
        {/* 左侧导航栏 */}
        <div className="setting-dialog-sidebar">
          <div className="setting-dialog-sidebar-title">
            <Trans>Setting</Trans>
          </div>

          {/* 第一组 */}
          <div className="setting-dialog-sidebar-group">
            {this.renderSidebarItem("general", "icon-setting", "General", "")}
            {this.renderSidebarItem("data", "icon-archive", "Data", "15px")}
            {this.renderSidebarItem(
              "reading",
              "icon-bookshelf-line",
              "Reading",
              ""
            )}
            {this.renderSidebarItem(
              "appearance",
              "icon-highlight-line",
              "Appearance",
              "20px"
            )}

            {this.renderSidebarItem("sync", "icon-sync", "Sync and backup", "")}

            {this.renderSidebarItem("account", "icon-user", "Account", "18px")}
          </div>

          <hr className="setting-dialog-sidebar-divider" />

          {/* 第二组 */}
          <div className="setting-dialog-sidebar-group">
            {this.renderSidebarItem("plugins", "icon-internet", "Plugins", "")}
            {this.renderSidebarItem(
              "ai",
              "icon-idea-line",
              "AI service",
              "18px"
            )}
            {this.renderSidebarItem(
              "background",
              "icon-image",
              "Background",
              "18px"
            )}
            {this.renderSidebarItem("about", "icon-detail", "About", "18px")}
          </div>
        </div>

        {/* 右侧主内容区 */}
        <div className="setting-dialog-main">
          <div className="setting-dialog-main-header">
            <Trans>{this.getCurrentPageTitle()}</Trans>
          </div>

          <div
            className="setting-close-container"
            onClick={() => {
              this.props.handleSetting(false);
              this.props.handleSettingMode("general");
            }}
          >
            <span className="icon-close setting-close"></span>
          </div>

          <div className="setting-dialog-info">
            {this.props.settingMode === "general" ? (
              <GeneralSetting />
            ) : this.props.settingMode === "reading" ? (
              <ReadingSetting />
            ) : this.props.settingMode === "appearance" ? (
              <AppearanceSetting />
            ) : this.props.settingMode === "sync" ? (
              <SyncSetting />
            ) : this.props.settingMode === "account" ? (
              <AccountSetting />
            ) : this.props.settingMode === "data" ? (
              <DataSetting />
            ) : this.props.settingMode === "about" ? (
              <AboutSetting />
            ) : this.props.settingMode === "ai" ? (
              <AISetting />
            ) : this.props.settingMode === "background" ? (
              <BackgroundSetting />
            ) : (
              <PluginSetting />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default SettingDialog;
