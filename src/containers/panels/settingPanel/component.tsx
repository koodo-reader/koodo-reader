import React from "react";
import "./settingPanel.css";
import { isReadingRawPDF } from "../../../utils/common";
import ThemeList from "../../../components/readerSettings/themeList";
import SliderList from "../../../components/readerSettings/sliderList";
import DropdownList from "../../../components/readerSettings/dropdownList";
import ModeControl from "../../../components/readerSettings/modeControl";
import SettingSwitch from "../../../components/readerSettings/settingSwitch";
import { SettingPanelProps, SettingPanelState } from "./interface";
import { Trans } from "react-i18next";
import {
  ConfigService,
  KookitConfig,
} from "../../../assets/lib/kookit-extra-browser.min";
import { sliderConfigs, dropdownList } from "../../../constants/dropdownList";
import { readerSettingList } from "../../../constants/settingList";
import toast from "react-hot-toast";

const SETTING_PANEL_TAB_KEY = "setting-panel-tab";

const PanelDropdownList = DropdownList as unknown as React.ComponentType<{
  group?: string;
}>;
const PanelSettingSwitch = SettingSwitch as unknown as React.ComponentType<{
  group?: string;
}>;

const panelTabs = [
  { key: "theme", title: "Theme" },
  { key: "layout", title: "Layout" },
  { key: "font", title: "Font" },
  { key: "more", title: "More" },
];

class SettingPanel extends React.Component<
  SettingPanelProps,
  SettingPanelState
> {
  constructor(props: SettingPanelProps) {
    super(props);
    const availableTabs = this.getAvailableTabs().map((item) => item.key);
    const savedTab = localStorage.getItem(SETTING_PANEL_TAB_KEY);
    this.state = {
      isSettingLocked:
        ConfigService.getReaderConfig("isSettingLocked") === "yes"
          ? true
          : false,
      isShowMenu: false,
      activeTab:
        savedTab && availableTabs.includes(savedTab) ? savedTab : "theme",
    };
  }

  hasGroupItems = (group: string) => {
    const isPDF = isReadingRawPDF(this.props.currentBook);
    return (
      sliderConfigs.some(
        (item) => item.group === group && (!isPDF || item.isPDF)
      ) ||
      dropdownList.some(
        (item) =>
          item.group === group &&
          item.value !== "fullTranslationMode" &&
          (!isPDF || item.isPDF)
      ) ||
      readerSettingList.some(
        (item) => item.group === group && (!isPDF || item.isPDF)
      )
    );
  };

  getAvailableTabs = () => {
    return panelTabs.filter(
      (item) => item.key !== "font" || this.hasGroupItems("font")
    );
  };

  handleTabChange = (activeTab: string) => {
    this.setState({ activeTab });
    localStorage.setItem(SETTING_PANEL_TAB_KEY, activeTab);
  };

  handleLock = () => {
    this.props.handleSettingLock(!this.props.isSettingLocked);
    ConfigService.setReaderConfig(
      "isSettingLocked",
      !this.props.isSettingLocked ? "yes" : "no"
    );
    setTimeout(() => {
      this.props.renderBookFunc();
    }, 300);
  };

  handleClearAllStyle = () => {
    if (
      ConfigService.getAllListConfig("seperateStyleBooks").includes(
        this.props.currentBook.key
      )
    ) {
      ConfigService.deleteObjectConfig(
        this.props.currentBook.key,
        "seperateStyleConfig"
      );
    } else {
      const readerConfig = JSON.parse(
        localStorage.getItem("readerConfig") || "{}"
      );
      KookitConfig.StyleKeys.forEach((key) => delete readerConfig[key]);
      localStorage.setItem("readerConfig", JSON.stringify(readerConfig));
    }

    toast.success(this.props.t("Clear successful"));
    this.props.handleBackgroundColor("");
    this.props.renderBookFunc();
  };

  renderSliders = (group: string) => {
    const isPDF = isReadingRawPDF(this.props.currentBook);
    return sliderConfigs
      .filter((item) => item.group === group && (!isPDF || item.isPDF))
      .map((item) => <SliderList key={item.mode} {...{ item }} />);
  };

  renderTabContent = (activeTab: string) => {
    switch (activeTab) {
      case "layout":
        return (
          <>
            <ModeControl />
            {this.renderSliders("layout")}
            <PanelDropdownList group="layout" />
            <PanelSettingSwitch group="layout" />
          </>
        );
      case "font":
        return (
          <>
            {this.renderSliders("font")}
            <PanelDropdownList group="font" />
            <PanelSettingSwitch group="font" />
          </>
        );
      case "more":
        return (
          <>
            <PanelDropdownList group="more" />
            <PanelSettingSwitch group="more" />
          </>
        );
      default:
        return (
          <>
            <ThemeList />
            {this.renderSliders("theme")}
            <PanelSettingSwitch group="theme" />
          </>
        );
    }
  };

  render() {
    const availableTabs = this.getAvailableTabs();
    const activeTab = availableTabs.some(
      (item) => item.key === this.state.activeTab
    )
      ? this.state.activeTab
      : "theme";
    const activeIndex = Math.max(
      availableTabs.findIndex((item) => item.key === activeTab),
      0
    );
    return (
      <div
        className="setting-panel-parent"
        style={{
          backgroundColor: this.props.isSettingLocked
            ? this.props.backgroundColor
            : "",
          color: this.props.isSettingLocked
            ? ConfigService.getReaderConfig("textColor")
            : "",
        }}
      >
        <span
          className={
            this.props.isSettingLocked
              ? "icon-lock lock-icon"
              : "icon-unlock lock-icon"
          }
          onClick={() => {
            this.handleLock();
          }}
        ></span>

        <div className="setting-panel-title">
          <Trans>Reading option</Trans>
        </div>
        <div className="setting-panel-tabs">
          <div
            className="setting-panel-tabs-indicator"
            style={{
              width: `calc((100% - 6px) / ${availableTabs.length})`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          ></div>
          {availableTabs.map((item) => (
            <div
              key={item.key}
              className={
                activeTab === item.key
                  ? "setting-panel-tab active"
                  : "setting-panel-tab"
              }
              onClick={() => {
                this.handleTabChange(item.key);
              }}
            >
              <Trans>{item.title}</Trans>
            </div>
          ))}
        </div>
        <div className="setting-panel" key={activeTab}>
          {this.renderTabContent(activeTab)}
          <div className="setting-panel-menu" style={{ marginTop: "5px" }}>
            <span
              className="icon-more menu-icon"
              onClick={() => {
                this.setState({ isShowMenu: !this.state.isShowMenu });
              }}
              style={{ fontSize: "15px" }}
            ></span>
          </div>
          <div
            className="action-dialog-container"
            style={{
              right: 5,
              top: 5,
              width: 150,
              display: this.state.isShowMenu ? "block" : "none",
            }}
            onMouseLeave={() => {
              this.setState({ isShowMenu: false });
            }}
          >
            <div className="action-dialog-actions-container" style={{}}>
              <div
                className="action-dialog-add"
                onClick={() => {
                  this.handleClearAllStyle();
                }}
              >
                <p className="action-name">
                  <Trans>Clear all style</Trans>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SettingPanel;
