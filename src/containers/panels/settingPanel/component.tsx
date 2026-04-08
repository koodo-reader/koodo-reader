import React from "react";
import "./settingPanel.css";
import ThemeList from "../../../components/readerSettings/themeList";
import SliderList from "../../../components/readerSettings/sliderList";
import DropdownList from "../../../components/readerSettings/dropdownList";
import ModeControl from "../../../components/readerSettings/modeControl";
import SettingSwitch from "../../../components/readerSettings/settingSwitch";
import { SettingPanelProps, SettingPanelState } from "./interface";
import { Trans } from "react-i18next";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { sliderConfigs } from "../../../constants/dropdownList";
import toast from "react-hot-toast";

class SettingPanel extends React.Component<
  SettingPanelProps,
  SettingPanelState
> {
  constructor(props: SettingPanelProps) {
    super(props);
    this.state = {
      isSettingLocked:
        ConfigService.getReaderConfig("isSettingLocked") === "yes"
          ? true
          : false,
      isShowMenu: false,
    };
  }

  handleLock = () => {
    this.props.handleSettingLock(!this.props.isSettingLocked);
    ConfigService.setReaderConfig(
      "isSettingLocked",
      !this.props.isSettingLocked ? "yes" : "no"
    );
    this.props.renderBookFunc();
  };

  handleClearAllStyle = () => {
    const styleKeys = [
      "backgroundColor",
      "textColor",
      "fontSize",
      "margin",
      "letterSpacing",
      "paraSpacing",
      "scale",
      "brightness",
      "fontFamily",
      "subFontFamily",
      "lineHeight",
      "textAlign",
      "textOrientation",
      "convertChinese",
      "selectAction",
      "fullTranslationMode",
      "readerMode",
      "pdfReaderMode",
      "isBold",
      "isIndent",
      "isSliding",
      "isUnderline",
      "isShadow",
      "isItalic",
      "isInvert",
      "isBionic",
      "isHyphenation",
      "isOrphanWidow",
      "isAllowScript",
      "isStartFromEven",
      "isHideBackground",
      "isHideFooter",
      "isHideHeader",
      "isHideAIButton",
      "isHideScaleButton",
      "isHidePDFConvertButton",
      "isHidePageButton",
      "isHideMenuButton",
      "isHideAudiobookButton",
      "isShowPageBorder",
    ];
    const readerConfig = JSON.parse(
      localStorage.getItem("readerConfig") || "{}"
    );
    styleKeys.forEach((key) => delete readerConfig[key]);
    localStorage.setItem("readerConfig", JSON.stringify(readerConfig));
    toast.success(this.props.t("Clear successful"));
    this.props.renderBookFunc();
  };

  render() {
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
        <div className="setting-panel">
          <ModeControl />
          <ThemeList />
          {sliderConfigs
            .filter((item) => {
              if (
                this.props.currentBook.format === "PDF" &&
                ConfigService.getReaderConfig("isConvertPDF") !== "yes"
              ) {
                return item.isPDF;
              }
              return true;
            })
            .map((item) => (
              <SliderList key={item.mode} {...{ item }} />
            ))}
          {this.props.currentBook.format === "PDF" &&
          ConfigService.getReaderConfig("isConvertPDF") !== "yes" ? null : (
            <DropdownList />
          )}
          <SettingSwitch />
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
