import { useState } from "react";
import { SettingInfoProps } from "./interface";
import { Trans } from "react-i18next";
import { isElectron } from "react-device-detect";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { readingSettingList } from "../../../constants/settingList";
import SwitchRow from "../../../components/readerSettings/switchRow";
declare var window: any;

const ReadingSetting = (props: SettingInfoProps) => {
  const [state, setState] = useState<Record<string, boolean>>({
    isTouch: ConfigService.getReaderConfig("isTouch") === "yes",
    isMergeWord: ConfigService.getReaderConfig("isMergeWord") === "yes",
    isPreventTrigger:
      ConfigService.getReaderConfig("isPreventTrigger") === "yes",
    isAutoFullscreen:
      ConfigService.getReaderConfig("isAutoFullscreen") === "yes",
    isAutoMaximize: ConfigService.getReaderConfig("isAutoMaximize") === "yes",
    isOpenBook: ConfigService.getReaderConfig("isOpenBook") === "yes",
    isDisablePopup: ConfigService.getReaderConfig("isDisablePopup") === "yes",
    isManualScroll: ConfigService.getReaderConfig("isManualScroll") === "yes",
    isDisableAutoScroll:
      ConfigService.getReaderConfig("isDisableAutoScroll") === "yes",
    isOpenInMain: ConfigService.getReaderConfig("isOpenInMain") === "yes",
    isOverwriteText:
      ConfigService.getReaderConfig("isOverwriteText") === "yes",
    isOverwriteLink:
      ConfigService.getReaderConfig("isOverwriteLink") === "yes",
    isOverwriteBackground:
      ConfigService.getReaderConfig("isOverwriteBackground") === "yes",
  });

  const handleRest = (_bool: boolean) => {
    toast.success(props.t("Change successful"));
  };

  const handleSetting = (stateName: string) => {
    if (stateName === "isLemmatizeWord" && !props.isAuthed) {
      toast.error(props.t("Please upgrade to Pro to use this feature"));
      props.handleSetting(true);
      props.handleSettingMode("account");
      return;
    }
    setState((prev) => ({ ...prev, [stateName]: !prev[stateName] }));
    ConfigService.setReaderConfig(stateName, state[stateName] ? "no" : "yes");
    handleRest(state[stateName]);
  };

  const handleResetReaderPosition = () => {
    window.electronAPI.invoke("reset-reader-position", "ping");
    toast.success(props.t("Reset successful"));
  };

  const handleMergeWord = () => {
    if (state.isOpenInMain && !state.isMergeWord) {
      toast(props.t("Please turn off open books in the main window"));
      return;
    }
    if (state.isAutoFullscreen && !state.isMergeWord) {
      toast(props.t("Please turn off auto open book in full screen"));
      return;
    }
    handleSetting("isMergeWord");
    props.handleMergeWord(
      ConfigService.getReaderConfig("isMergeWord") === "yes"
    );
  };

  const handleOpenInMain = () => {
    if (state.isMergeWord && !state.isOpenInMain) {
      toast(props.t("Please turn off merge with word first"));
      return;
    }
    handleSetting("isOpenInMain");
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
                case "isMergeWord":
                  handleMergeWord();
                  break;
                case "isOpenInMain":
                  handleOpenInMain();
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

  return (
    <>
      {renderSwitchOption(readingSettingList)}
      {isElectron && (
        <>
          <div className="setting-dialog-new-title">
            <Trans>Reset reader window's position</Trans>

            <span
              className="change-location-button"
              onClick={() => {
                handleResetReaderPosition();
              }}
            >
              <Trans>Reset</Trans>
            </span>
          </div>
        </>
      )}
    </>
  );
};

export default ReadingSetting;
