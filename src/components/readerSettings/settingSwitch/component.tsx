import React from "react";
import { SettingSwitchProps, SettingSwitchState } from "./interface";
import { Trans } from "react-i18next";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { readerSettingList } from "../../../constants/settingList";
import { wordFrequencyList } from "../../../constants/dropdownList";
import toast from "react-hot-toast";
import { vexComfirmAsync, detectLocalLanguage } from "../../../utils/common";
import BookUtil from "../../../utils/file/bookUtil";
class SettingSwitch extends React.Component<
  SettingSwitchProps,
  SettingSwitchState
> {
  constructor(props: SettingSwitchProps) {
    super(props);
    this.state = {
      isBold: ConfigService.getReaderConfig("isBold") === "yes",
      isIndent: ConfigService.getReaderConfig("isIndent") === "yes",
      isSliding: ConfigService.getReaderConfig("isSliding") === "yes",
      isUnderline: ConfigService.getReaderConfig("isUnderline") === "yes",
      isShadow: ConfigService.getReaderConfig("isShadow") === "yes",
      isItalic: ConfigService.getReaderConfig("isItalic") === "yes",
      isInvert: ConfigService.getReaderConfig("isInvert") === "yes",
      isBionic: ConfigService.getReaderConfig("isBionic") === "yes",
      isHyphenation: ConfigService.getReaderConfig("isHyphenation") === "yes",
      isOrphanWidow: ConfigService.getReaderConfig("isOrphanWidow") === "yes",
      isAllowScript: ConfigService.getReaderConfig("isAllowScript") === "yes",
      isStartFromEven:
        ConfigService.getReaderConfig("isStartFromEven") === "yes",
      isHideBackground:
        ConfigService.getReaderConfig("isHideBackground") === "yes",
      isHideFooter: ConfigService.getReaderConfig("isHideFooter") === "yes",
      isHideHeader: ConfigService.getReaderConfig("isHideHeader") === "yes",
      isHideAIButton: ConfigService.getReaderConfig("isHideAIButton") === "yes",
      isHideScaleButton:
        ConfigService.getReaderConfig("isHideScaleButton") === "yes",
      isHidePDFConvertButton:
        ConfigService.getReaderConfig("isHidePDFConvertButton") === "yes",
      isHidePageButton:
        ConfigService.getReaderConfig("isHidePageButton") === "yes",
      isHideMenuButton:
        ConfigService.getReaderConfig("isHideMenuButton") === "yes",
      isHideAudiobookButton:
        ConfigService.getReaderConfig("isHideAudiobookButton") === "yes",
      isShowPageBorder:
        ConfigService.getReaderConfig("isShowPageBorder") === "yes",
      isCustomBookCSS:
        ConfigService.getReaderConfig("isCustomBookCSS") === "yes",
      customBookCSS: ConfigService.getReaderConfig("customBookCSS") || "",
      isWordDefinition: ConfigService.getAllListConfig(
        "wordDefinitionBooks"
      ).includes(props.currentBook?.key),
      wordDefinitionLang: "",
      currentChineseLevel:
        ConfigService.getReaderConfig("currentChineseLevel") || "HSK3",
      currentJapaneseLevel:
        ConfigService.getReaderConfig("currentJapaneseLevel") || "N3",
      currentEnglishLevel:
        ConfigService.getReaderConfig("currentEnglishLevel") || "四级",
    };
  }

  _handleChange = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any, () => {
      ConfigService.setReaderConfig(
        stateName,
        this.state[stateName] ? "yes" : "no"
      );
      toast(this.props.t("Change successful"));
      setTimeout(async () => {
        await this.props.renderBookFunc();
      }, 500);
    });
  };

  handleChange = (stateName: string) => {
    this.setState({ [stateName]: !this.state[stateName] } as any);
    ConfigService.setReaderConfig(
      stateName,
      this.state[stateName] ? "no" : "yes"
    );

    toast(this.props.t("Change successful"));
  };
  render() {
    return (
      <>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <span
            style={{
              textDecoration: "underline",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <Trans>
              The audiobook feature has been moved to the bottom right of the
              book page
            </Trans>
          </span>
        </div>
        <div className="single-control-switch-container" key="isCustomBookCSS">
          <span className="single-control-switch-title">
            <Trans>Custom book style (CSS)</Trans>
          </span>
          <span
            className="single-control-switch"
            onClick={() => {
              const next = !this.state.isCustomBookCSS;
              this.setState({ isCustomBookCSS: next }, () => {
                ConfigService.setReaderConfig(
                  "isCustomBookCSS",
                  next ? "yes" : "no"
                );
                if (!this.state.customBookCSS) {
                  return;
                }
                toast(this.props.t("Change successful"));
                setTimeout(async () => {
                  await this.props.renderBookFunc();
                }, 500);
              });
            }}
            style={this.state.isCustomBookCSS ? {} : { opacity: 0.6 }}
          >
            <span
              className="single-control-button"
              style={
                !this.state.isCustomBookCSS
                  ? {
                      transform: "translateX(0px)",
                      transition: "transform 0.5s ease",
                      marginTop: "3px",
                    }
                  : {
                      transform: "translateX(20px)",
                      transition: "transform 0.5s ease",
                      marginTop: "3px",
                    }
              }
            ></span>
          </span>
        </div>
        {this.state.isCustomBookCSS && (
          <div style={{ margin: "10px 20px" }}>
            <textarea
              className="token-dialog-token-box"
              placeholder={
                "/* " + this.props.t("Enter custom CSS here") + " */"
              }
              value={this.state.customBookCSS}
              onChange={(e) => {
                const val = e.target.value;
                this.setState({ customBookCSS: val });
              }}
              onBlur={() => {
                ConfigService.setReaderConfig(
                  "customBookCSS",
                  this.state.customBookCSS
                );
                toast(this.props.t("Change successful"));
                setTimeout(async () => {
                  await this.props.renderBookFunc();
                }, 500);
              }}
            />
          </div>
        )}
        <div className="single-control-switch-container" key="isWordDefinition">
          <span className="single-control-switch-title">
            <Trans>Enable word definitions</Trans>
          </span>
          <span
            className="single-control-switch"
            onClick={async () => {
              const next = !this.state.isWordDefinition;
              if (next) {
                if (!this.props.isAuthed) {
                  toast(
                    this.props.t("Please upgrade to Pro to use this feature")
                  );
                  this.props.handleSetting(true);
                  this.props.handleSettingMode("account");
                  ConfigService.setReaderConfig("fullTranslationMode", "no");
                  return;
                }
                ConfigService.setListConfig(
                  this.props.currentBook.key,
                  "wordDefinitionBooks"
                );
                let lang = "";
                if (this.props.htmlBook?.rendition) {
                  try {
                    const text =
                      await this.props.htmlBook.rendition.audioText();
                    if (text && text.length > 0) {
                      lang = detectLocalLanguage(text.slice(0, 500).join(" "));
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }
                this.setState({
                  isWordDefinition: true,
                  wordDefinitionLang: lang,
                });
              } else {
                ConfigService.deleteListConfig(
                  this.props.currentBook.key,
                  "wordDefinitionBooks"
                );
                this.setState({
                  isWordDefinition: false,
                  wordDefinitionLang: "",
                });
              }
              toast(this.props.t("Change successful"));
              this.props.renderBookFunc();
            }}
            style={this.state.isWordDefinition ? {} : { opacity: 0.6 }}
          >
            <span
              className="single-control-button"
              style={
                !this.state.isWordDefinition
                  ? {
                      transform: "translateX(0px)",
                      transition: "transform 0.5s ease",
                      marginTop: "3px",
                    }
                  : {
                      transform: "translateX(20px)",
                      transition: "transform 0.5s ease",
                      marginTop: "3px",
                    }
              }
            ></span>
          </span>
        </div>
        {this.state.isWordDefinition &&
          (this.state.wordDefinitionLang === "zh" ||
            this.state.wordDefinitionLang === "ja" ||
            this.state.wordDefinitionLang === "en") &&
          (() => {
            const langKey =
              this.state.wordDefinitionLang === "zh"
                ? "currentChineseLevel"
                : this.state.wordDefinitionLang === "ja"
                  ? "currentJapaneseLevel"
                  : "currentEnglishLevel";
            const levelItem = wordFrequencyList.find(
              (item) => item.value === langKey
            );
            if (!levelItem) return null;
            const stateKey = langKey as
              | "currentChineseLevel"
              | "currentJapaneseLevel"
              | "currentEnglishLevel";
            return (
              <li
                className="paragraph-character-container"
                key={langKey}
                style={{ margin: "0 20px" }}
              >
                <p className="general-setting-title">
                  <Trans>{levelItem.title}</Trans>
                </p>
                <select
                  className="general-setting-dropdown"
                  value={this.state[stateKey]}
                  onChange={(e) => {
                    const val = e.target.value;
                    this.setState({ [stateKey]: val } as any);
                    ConfigService.setReaderConfig(langKey, val);
                    toast(this.props.t("Change successful"));

                    this.props.renderBookFunc();
                  }}
                >
                  {levelItem.option.map((opt, idx) => (
                    <option
                      key={idx}
                      value={opt.value}
                      className="general-setting-option"
                    >
                      {this.props.t(opt.label)}
                    </option>
                  ))}
                </select>
              </li>
            );
          })()}
        {readerSettingList
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
            <div className="single-control-switch-container" key={item.title}>
              <span className="single-control-switch-title">
                <Trans>{item.title}</Trans>
              </span>

              <span
                className="single-control-switch"
                onClick={async () => {
                  const propName = item.propName as keyof SettingSwitchState;
                  const renderProps: Partial<
                    Record<keyof SettingSwitchState, (val: boolean) => void>
                  > = {
                    isHideFooter: this.props.handleHideFooter,
                    isHideHeader: this.props.handleHideHeader,
                    isHideBackground: this.props.handleHideBackground,
                    isHidePageButton: this.props.handleHidePageButton,
                    isHideAIButton: this.props.handleHideAIButton,
                    isHideScaleButton: this.props.handleHideScaleButton,
                    isHidePDFConvertButton:
                      this.props.handleHidePDFConvertButton,
                    isShowPageBorder: this.props.handleShowBorder,
                  };

                  if (propName === "isHideMenuButton") {
                    if (!this.state.isHideMenuButton) {
                      const result = await vexComfirmAsync(
                        "After hiding the menu button, you can move the mouse to the edge of the window to show it again."
                      );
                      if (result) {
                        this.props.handleHideMenuButton(true);
                        ConfigService.setReaderConfig(
                          "isHideMenuButton",
                          "yes"
                        );
                        toast(this.props.t("Change successful"));
                      }
                    } else {
                      this.props.handleHideMenuButton(false);
                      this.handleChange("isHideMenuButton");
                    }
                  } else if (propName === "isHideAudiobookButton") {
                    this.props.handleHideAudiobookButton(
                      !this.state.isHideAudiobookButton
                    );
                    this.handleChange("isHideAudiobookButton");
                  } else if (propName === "isShowPageBorder") {
                    this.props.handleShowBorder(!this.state.isShowPageBorder);
                    if (!this.state.isShowPageBorder) {
                      this.props.handleHideBackground(true);
                      this.handleChange("isHideBackground");
                    }

                    this.handleChange("isShowPageBorder");
                  } else if (propName === "isAllowScript") {
                    this.handleChange(propName);
                    setTimeout(() => {
                      BookUtil.reloadBooks(this.props.currentBook);
                    }, 500);
                  } else if (propName in renderProps) {
                    renderProps[propName]!(!this.state[propName]);
                    this.handleChange(propName);
                  } else {
                    this._handleChange(propName);
                  }
                }}
                style={this.state[item.propName] ? {} : { opacity: 0.6 }}
              >
                <span
                  className="single-control-button"
                  style={
                    !this.state[item.propName]
                      ? {
                          transform: "translateX(0px)",
                          transition: "transform 0.5s ease",
                          marginTop: "3px",
                        }
                      : {
                          transform: "translateX(20px)",
                          transition: "transform 0.5s ease",
                          marginTop: "3px",
                        }
                  }
                ></span>
              </span>
            </div>
          ))}
      </>
    );
  }
}

export default SettingSwitch;
