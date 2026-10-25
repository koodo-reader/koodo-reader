import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import "./settingPanel.css";
import { isReadingRawPDF } from "../../../utils/common";
import ThemeList from "../../../components/readerSettings/themeList";
import SliderList from "../../../components/readerSettings/sliderList";
import DropdownList from "../../../components/readerSettings/dropdownList";
import ModeControl from "../../../components/readerSettings/modeControl";
import SettingSwitch from "../../../components/readerSettings/settingSwitch";
import { SettingPanelProps } from "./interface";
import { Trans } from "react-i18next";
import {
  ConfigService,
  KookitConfig,
} from "../../../assets/lib/kookit-extra-browser.min";
import { sliderConfigs, dropdownList } from "../../../constants/dropdownList";
import { readerSettingList } from "../../../constants/settingList";
import toast from "react-hot-toast";
import { useAppStore } from "../../../store/useAppStore";

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

const SettingPanel = () => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const backgroundColor = useAppStore((s) => s.reader.backgroundColor);
  const isSettingLocked = useAppStore((s) => s.reader.isSettingLocked);
  const renderBookFunc = useAppStore((s) => s.book.renderBookFunc);
  const handleSettingLock = useAppStore((s) => s.handleSettingLock);
  const handleBackgroundColor = useAppStore((s) => s.handleBackgroundColor);
  const { t } = useTranslation();
  const hasGroupItems = (group: string) => {
    const isPDF = isReadingRawPDF(currentBook);
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

  const getAvailableTabs = () => {
    return panelTabs.filter(
      (item) => item.key !== "font" || hasGroupItems("font")
    );
  };

  const [isShowMenu, setIsShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const availableTabs = getAvailableTabs().map((item) => item.key);
    const savedTab = localStorage.getItem(SETTING_PANEL_TAB_KEY);
    return savedTab && availableTabs.includes(savedTab) ? savedTab : "theme";
  });

  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab);
    localStorage.setItem(SETTING_PANEL_TAB_KEY, nextTab);
  };

  const handleLock = () => {
    handleSettingLock(!isSettingLocked);
    ConfigService.setReaderConfig(
      "isSettingLocked",
      !isSettingLocked ? "yes" : "no"
    );
    setTimeout(() => {
      renderBookFunc();
    }, 300);
  };

  const handleClearAllStyle = () => {
    if (
      ConfigService.getAllListConfig("seperateStyleBooks").includes(
        currentBook.key
      )
    ) {
      ConfigService.deleteObjectConfig(
        currentBook.key,
        "seperateStyleConfig"
      );
    } else {
      const readerConfig = JSON.parse(
        localStorage.getItem("readerConfig") || "{}"
      );
      KookitConfig.StyleKeys.forEach((key) => delete readerConfig[key]);
      localStorage.setItem("readerConfig", JSON.stringify(readerConfig));
    }

    toast.success(t("Clear successful"));
    handleBackgroundColor("");
    renderBookFunc();
  };

  const renderSliders = (group: string) => {
    const isPDF = isReadingRawPDF(currentBook);
    return sliderConfigs
      .filter((item) => item.group === group && (!isPDF || item.isPDF))
      .map((item) => <SliderList key={item.mode} {...{ item }} />);
  };

  const renderTabContent = (tab: string) => {
    switch (tab) {
      case "layout":
        return (
          <>
            <ModeControl />
            {renderSliders("layout")}
            <PanelDropdownList group="layout" />
            <PanelSettingSwitch group="layout" />
          </>
        );
      case "font":
        return (
          <>
            {renderSliders("font")}
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
            {renderSliders("theme")}
            <PanelSettingSwitch group="theme" />
          </>
        );
    }
  };

  const availableTabs = getAvailableTabs();
  const currentTab = availableTabs.some((item) => item.key === activeTab)
    ? activeTab
    : "theme";
  const activeIndex = Math.max(
    availableTabs.findIndex((item) => item.key === currentTab),
    0
  );

  return (
    <div
      className="setting-panel-parent"
      style={{
        backgroundColor: isSettingLocked ? backgroundColor : "",
        color: isSettingLocked
          ? ConfigService.getReaderConfig("textColor")
          : "",
      }}
    >
      <span
        className={
          isSettingLocked
            ? "icon-lock lock-icon"
            : "icon-unlock lock-icon"
        }
        onClick={() => {
          handleLock();
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
              currentTab === item.key
                ? "setting-panel-tab active"
                : "setting-panel-tab"
            }
            onClick={() => {
              handleTabChange(item.key);
            }}
          >
            <Trans>{item.title}</Trans>
          </div>
        ))}
      </div>
      <div className="setting-panel" key={currentTab}>
        {renderTabContent(currentTab)}
        <div className="setting-panel-menu" style={{ marginTop: "5px" }}>
          <span
            className="icon-more menu-icon"
            onClick={() => {
              setIsShowMenu((prev) => !prev);
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
            display: isShowMenu ? "block" : "none",
          }}
          onMouseLeave={() => {
            setIsShowMenu(false);
          }}
        >
          <div className="action-dialog-actions-container" style={{}}>
            <div
              className="action-dialog-add"
              onClick={() => {
                handleClearAllStyle();
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
};

export default SettingPanel;
