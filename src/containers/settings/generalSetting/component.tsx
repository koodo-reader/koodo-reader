import { useTranslation } from "react-i18next";
import { useState } from "react";
import { SettingInfoProps } from "./interface";
import { Trans } from "react-i18next";
import i18n from "../../../i18n";
import { isElectron } from "react-device-detect";
import _ from "underscore";
import {
  generalSettingList,
  langList,
  searchList,
} from "../../../constants/settingList";

import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import SwitchRow from "../../../components/readerSettings/switchRow";

declare var window: any;
const GeneralSetting = (props: SettingInfoProps) => {
  const { t } = useTranslation();
  const [state, setState] = useState<Record<string, any>>({
    isImportPath: ConfigService.getReaderConfig("isImportPath") === "yes",
    isMergeWord: ConfigService.getReaderConfig("isMergeWord") === "yes",
    isPreventAdd: ConfigService.getReaderConfig("isPreventAdd") === "yes",
    isDisableTrashBin:
      ConfigService.getReaderConfig("isDisableTrashBin") === "yes",
    isDeleteShelfBook:
      ConfigService.getReaderConfig("isDeleteShelfBook") === "yes",
    isHideShelfBook:
      ConfigService.getReaderConfig("isHideShelfBook") === "yes",
    isPreventSleep: ConfigService.getReaderConfig("isPreventSleep") === "yes",
    isAlwaysOnTop: ConfigService.getReaderConfig("isAlwaysOnTop") === "yes",
    isAutoMaximizeWin:
      ConfigService.getReaderConfig("isAutoMaximizeWin") === "yes",
    isAutoLaunch: ConfigService.getReaderConfig("isAutoLaunch") === "yes",
    isMinimizeToTray:
      ConfigService.getReaderConfig("isMinimizeToTray") === "yes",
    isOpenInMain: ConfigService.getReaderConfig("isOpenInMain") === "yes",
    isDisableAI: ConfigService.getReaderConfig("isDisableAI") === "yes",
    isUseOriginalName:
      ConfigService.getReaderConfig("isUseOriginalName") === "yes",
    isAIAnalyzeTitle:
      ConfigService.getReaderConfig("isAIAnalyzeTitle") === "yes",
    isExportOriginalName:
      ConfigService.getReaderConfig("isExportOriginalName") === "yes",
    isDisableUpdate:
      ConfigService.getReaderConfig("isDisableUpdate") === "yes",
    isPrecacheBook: ConfigService.getReaderConfig("isPrecacheBook") === "yes",
    isUseBuiltIn: ConfigService.getReaderConfig("isUseBuiltIn") === "yes",
    isDeleteOriginal:
      ConfigService.getReaderConfig("isDeleteOriginal") === "yes",
    startupShelf: ConfigService.getReaderConfig("startupShelf") || "",
  });
  const [searchEngine, setSearchEngine] = useState(
    ConfigService.getReaderConfig("searchEngine") ||
      (navigator.language === "zh-CN" ? "baidu" : "google")
  );

  const handleRest = (_bool: boolean) => {
    toast.success(t("Change successful"));
  };
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    ConfigService.setReaderConfig("lang", lng);
  };
  const changeSearch = (nextSearchEngine: string) => {
    ConfigService.setReaderConfig("searchEngine", nextSearchEngine);
    setSearchEngine(nextSearchEngine);
  };
  const handleSetting = (stateName: string) => {
    setState((prev) => ({ ...prev, [stateName]: !prev[stateName] }));
    ConfigService.setReaderConfig(
      stateName,
      state[stateName] ? "no" : "yes"
    );
    handleRest(state[stateName]);
  };

  const handleOpenInMain = () => {
    if (state.isMergeWord && !state.isOpenInMain) {
      toast(t("Please turn off merge with word first"));
      return;
    }
    handleSetting("isOpenInMain");
  };
  const handleAlwaysOnTop = () => {
    const ipcRenderer = window.electronAPI;
    ipcRenderer.invoke("set-always-on-top", {
      isAlwaysOnTop: state.isAlwaysOnTop ? "no" : "yes",
    });
    handleSetting("isAlwaysOnTop");
  };
  const handleMaximizeWin = () => {
    const ipcRenderer = window.electronAPI;
    ipcRenderer.invoke("set-auto-maximize", {
      isAutoMaximizeWin: state.isAutoMaximizeWin ? "no" : "yes",
    });
    handleSetting("isAutoMaximizeWin");
  };
  const handleAutoLaunch = () => {
    const ipcRenderer = window.electronAPI;
    ipcRenderer.invoke("toggle-auto-launch", {
      isAutoLaunch: state.isAutoLaunch ? "no" : "yes",
    });
    handleSetting("isAutoLaunch");
  };
  const handleMinimizeToTray = () => {
    const ipcRenderer = window.electronAPI;
    ipcRenderer.invoke("toggle-minimize-to-tray", {
      isMinimizeToTray: state.isMinimizeToTray ? "no" : "yes",
    });
    handleSetting("isMinimizeToTray");
  };
  const renderSwitchOption = (optionList: any[]) => {
    return optionList.map((item) => {
      return (
        <div
          style={item.isElectron ? (isElectron ? {} : { display: "none" }) : {}}
          key={item.propName}
        >
          <SwitchRow
            variant="setting"
            title={<Trans>{item.title}</Trans>}
            isEnabled={state[item.propName]}
            onClick={() => {
              switch (item.propName) {
                case "isOpenInMain":
                  handleOpenInMain();
                  break;
                case "isAlwaysOnTop":
                  handleAlwaysOnTop();
                  break;
                case "isAutoMaximizeWin":
                  handleMaximizeWin();
                  break;
                case "isAutoLaunch":
                  handleAutoLaunch();
                  break;
                case "isMinimizeToTray":
                  handleMinimizeToTray();
                  break;
                default:
                  handleSetting(item.propName);
                  break;
              }
            }}
          />
          <p className="setting-option-subtitle">
            <Trans>{item.desc}</Trans>
          </p>
        </div>
      );
    });
  };
  const handleResetMainPosition = () => {
    window
      .electronAPI
      .invoke("reset-main-position", "ping");
    toast.success(t("Reset successful"));
  };
  return (
      <>
        {renderSwitchOption(generalSettingList)}

        <div className="setting-dialog-new-title">
          <Trans>Reset main window's position</Trans>

          <span
            className="change-location-button"
            onClick={() => {
              handleResetMainPosition();
            }}
          >
            <Trans>Reset</Trans>
          </span>
        </div>

        <div className="setting-dialog-new-title">
          <Trans>Language</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            value={ConfigService.getReaderConfig("lang") || "en"}
            onChange={(event) => {
              changeLanguage(event.target.value);
            }}
          >
            {langList.map((item) => (
              <option
                value={item.value}
                key={item.value}
                className="lang-setting-option"
              >
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="setting-dialog-new-title">
          <Trans>Default search engine</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            value={searchEngine}
            onChange={(event) => {
              changeSearch(event.target.value);
            }}
          >
            {searchList.map((item) => (
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
        <div className="setting-dialog-new-title">
          <Trans>Auto switch to shelf on startup</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            value={state.startupShelf || ""}
            onChange={(event) => {
              const value = event.target.value;
              ConfigService.setReaderConfig("startupShelf", value);
              setState((prev) => ({ ...prev, startupShelf: value }));
              toast.success(t("Change successful"));
            }}
          >
            <option
              value=""
              className="lang-setting-option"
            >
              {t("Disabled")}
            </option>
            {Object.keys(ConfigService.getAllMapConfig("shelfList") || {}).map(
              (shelfName) => (
                <option
                  value={shelfName}
                  key={shelfName}
                  className="lang-setting-option"
                >
                  {shelfName}
                </option>
              )
            )}
          </select>
        </div>
      </>
  );
};

export default GeneralSetting;
