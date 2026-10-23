import React from "react";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  dropdownList,
  fullTranslationLangList,
  wordFrequencyList,
} from "../../../constants/dropdownList";
import { detectLocalLanguage } from "../../../utils/common";
import { StudyLangDialogProps, StudyLangDialogState } from "./interface";
import "../scalePageDialog/scalePageDialog.css";

class StudyLangDialog extends React.Component<
  StudyLangDialogProps,
  StudyLangDialogState
> {
  constructor(props: StudyLangDialogProps) {
    super(props);
    this.state = {
      fullTranslationModeValue: ConfigService.getAllListConfig(
        "fullTranslationBooks"
      ).includes(props.currentBook?.key)
        ? ConfigService.getReaderConfig("fullTranslationMode") || ""
        : "",
      fullTranslationTargetValue:
        ConfigService.getReaderConfig("fullTranslationTarget") ||
        ConfigService.getReaderConfig("lang") ||
        "zhCN",
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

  componentDidMount() {
    if (this.state.isWordDefinition) {
      this.refreshWordDefinitionLang();
    }
  }

  componentDidUpdate(prevProps: StudyLangDialogProps) {
    if (
      prevProps.htmlBook !== this.props.htmlBook &&
      this.state.isWordDefinition &&
      !this.state.wordDefinitionLang
    ) {
      this.refreshWordDefinitionLang();
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: StudyLangDialogProps) {
    if (nextProps.currentBook?.key !== this.props.currentBook?.key) {
      const isWordDefinition = ConfigService.getAllListConfig(
        "wordDefinitionBooks"
      ).includes(nextProps.currentBook?.key);
      this.setState(
        {
          fullTranslationModeValue: ConfigService.getAllListConfig(
            "fullTranslationBooks"
          ).includes(nextProps.currentBook?.key)
            ? ConfigService.getReaderConfig("fullTranslationMode") || ""
            : "",
          isWordDefinition,
          wordDefinitionLang: "",
          currentChineseLevel:
            ConfigService.getReaderConfig("currentChineseLevel") || "HSK3",
          currentJapaneseLevel:
            ConfigService.getReaderConfig("currentJapaneseLevel") || "N3",
          currentEnglishLevel:
            ConfigService.getReaderConfig("currentEnglishLevel") || "四级",
        },
        () => {
          if (isWordDefinition) {
            this.refreshWordDefinitionLang();
          }
        }
      );
    }
  }

  refreshWordDefinitionLang = async () => {
    if (!this.props.htmlBook?.rendition) return;
    try {
      const text = await this.props.htmlBook.rendition.audioText();
      if (text && text.length > 0) {
        this.setState({
          wordDefinitionLang: detectLocalLanguage(text.slice(0, 500).join(" ")),
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  handleFullTranslationChange = (value: string) => {
    this.setState({ fullTranslationModeValue: value });
    if (value === "no" || value === "") {
      ConfigService.deleteListConfig(
        this.props.currentBook.key,
        "fullTranslationBooks"
      );
    } else {
      if (!this.props.isAuthed) {
        this.setState({ fullTranslationModeValue: "no" });
        toast(this.props.t("Please upgrade to Pro to use this feature"));
        this.props.handleSetting(true);
        this.props.handleSettingMode("account");
        ConfigService.setReaderConfig("fullTranslationMode", "no");
        return;
      }
      ConfigService.setListConfig(
        this.props.currentBook.key,
        "fullTranslationBooks"
      );
    }
    toast.success(this.props.t("Setup successful"));
    this.props.renderBookFunc();
  };

  handleWordDefinitionToggle = async () => {
    const next = !this.state.isWordDefinition;
    if (next) {
      if (!this.props.isAuthed) {
        toast(this.props.t("Please upgrade to Pro to use this feature"));
        this.props.handleSetting(true);
        this.props.handleSettingMode("account");
        ConfigService.setReaderConfig("fullTranslationMode", "no");
        return;
      }
      if (ConfigService.getReaderConfig("isBionic") === "yes") {
        toast.error(
          this.props.t(
            "Word definitions and fast reading mode cannot be enabled at the same time"
          )
        );
        return;
      }
      const lang = await this.detectWordDefinitionLang();
      if (lang === "ko") {
        toast.error(
          this.props.t(
            "Unsupported language for word definition, currently only Chinese, Japanese and English are supported"
          )
        );
        return;
      }
      ConfigService.setListConfig(
        this.props.currentBook.key,
        "wordDefinitionBooks"
      );
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
    setTimeout(() => {
      this.props.renderBookFunc();
    }, 500);
  };

  detectWordDefinitionLang = async () => {
    if (!this.props.htmlBook?.rendition) return "";
    try {
      const text = await this.props.htmlBook.rendition.audioText();
      if (text && text.length > 0) {
        return detectLocalLanguage(text.slice(0, 500).join(" "));
      }
    } catch (error) {
      console.error(error);
    }
    return "";
  };

  renderWordLevelSelect = () => {
    if (!this.state.isWordDefinition) return null;
    if (
      this.state.wordDefinitionLang !== "zh" &&
      this.state.wordDefinitionLang !== "ja" &&
      this.state.wordDefinitionLang !== "en"
    ) {
      return null;
    }
    const langKey =
      this.state.wordDefinitionLang === "zh"
        ? "currentChineseLevel"
        : this.state.wordDefinitionLang === "ja"
          ? "currentJapaneseLevel"
          : "currentEnglishLevel";
    const levelItem = wordFrequencyList.find((item) => item.value === langKey);
    if (!levelItem) return null;
    return (
      <div
        className="setting-dialog-new-title scale-page-preset-row"
        key={langKey}
      >
        <span>
          <Trans>{levelItem.title}</Trans>
        </span>
        <select
          className="lang-setting-dropdown"
          value={this.state[langKey as keyof StudyLangDialogState] as string}
          onChange={(event) => {
            const value = event.target.value;
            this.setState({ [langKey]: value } as any);
            ConfigService.setReaderConfig(langKey, value);
            toast(this.props.t("Change successful"));
            this.props.renderBookFunc();
          }}
        >
          {levelItem.option.map((option, index) => (
            <option
              key={index}
              value={option.value}
              className="lang-setting-option"
            >
              {this.props.t(option.label)}
            </option>
          ))}
        </select>
      </div>
    );
  };

  render() {
    const fullTranslationItem = dropdownList.find(
      (item) => item.value === "fullTranslationMode"
    );
    const fullTranslationOptions = fullTranslationItem?.option || [
      { label: "Disable", value: "no" },
      { label: "Bilingual translation", value: "both" },
      { label: "Only translation", value: "target" },
    ];
    return (
      <div
        className="sort-dialog-container scale-page-dialog-container study-lang-dialog-container"
        onMouseLeave={() => {
          this.props.handleStudyLangDialog(false);
        }}
        onMouseEnter={() => {
          this.props.handleStudyLangDialog(true);
        }}
        style={{
          left: "auto",
          top: "50px",
          width: "280px",
          right:
            this.props.isSettingLocked || this.props.isDockedRight ? 325 : 20,
          overflowY: "auto",
          maxHeight: "calc(100vh - 80px)",
        }}
      >
        <ul className="sort-by-category">
          <div className="setting-dialog-new-title scale-page-preset-row">
            <span>
              <Trans>Full text translation</Trans>
              <span style={{ fontSize: "13px", color: "#f16464" }}> (Pro)</span>
            </span>
            <select
              className="lang-setting-dropdown"
              value={this.state.fullTranslationModeValue}
              onChange={(event) => {
                this.handleFullTranslationChange(event.target.value);
              }}
            >
              {fullTranslationOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="lang-setting-option"
                >
                  {this.props.t(option.label)}
                </option>
              ))}
            </select>
          </div>
          {(this.state.fullTranslationModeValue === "both" ||
            this.state.fullTranslationModeValue === "target") && (
            <div className="setting-dialog-new-title scale-page-preset-row">
              <span style={{ maxWidth: "120px" }}>
                <Trans>Target translation language</Trans>
              </span>
              <select
                className="lang-setting-dropdown"
                value={
                  fullTranslationLangList.find(
                    (option) =>
                      option.code === this.state.fullTranslationTargetValue
                  )?.code || this.state.fullTranslationTargetValue
                }
                onChange={(event) => {
                  const value = event.target.value;
                  this.setState({ fullTranslationTargetValue: value });
                  ConfigService.setReaderConfig("fullTranslationTarget", value);
                  toast(this.props.t("Change successful"));
                  this.props.renderBookFunc();
                }}
              >
                {fullTranslationLangList.map((option) => (
                  <option
                    key={option.code}
                    value={option.code}
                    className="lang-setting-option"
                  >
                    {this.props.t(option.label)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div
            className="scale-page-fit-switch"
            onClick={() => {
              this.handleWordDefinitionToggle();
            }}
          >
            <span className="scale-page-fit-switch-title">
              <Trans>Enable word definitions</Trans>
              <span style={{ fontSize: "13px", color: "#f16464" }}> (Pro)</span>
            </span>
            <span
              className="single-control-switch"
              style={this.state.isWordDefinition ? {} : { opacity: 0.6 }}
            >
              <span
                className="single-control-button"
                style={
                  !this.state.isWordDefinition
                    ? {
                        transform: "translateX(0px)",
                        transition: "transform 0.5s ease",
                      }
                    : {
                        transform: "translateX(20px)",
                        transition: "transform 0.5s ease",
                      }
                }
              ></span>
            </span>
          </div>
          <p
            className="setting-option-subtitle"
            style={{ margin: "4px 0 0", fontSize: "13px", lineHeight: 1.5 }}
          >
            <Trans>
              {"Add definition next to the English, Chinese, Japanese words"}
            </Trans>
          </p>
          {this.renderWordLevelSelect()}
        </ul>
      </div>
    );
  }
}

export default StudyLangDialog;
