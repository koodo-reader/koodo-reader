import { useLatest } from "../../../utils/hooks/useLatest";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  dropdownList,
  fullTranslationLangList,
  wordFrequencyList,
} from "../../../constants/dropdownList";
import { detectLocalLanguage } from "../../../utils/common";
import SwitchRow from "../../readerSettings/switchRow";
import { StudyLangDialogState } from "./interface";
import { useAppStore } from "../../../store/useAppStore";

const StudyLangDialog = () => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const isAuthed = useAppStore((s) => s.manager.isAuthed);
  const renderBookFunc = useAppStore((s) => s.book.renderBookFunc);
  const handleStudyLangDialog = useAppStore((s) => s.handleStudyLangDialog);
  const handleSetting = useAppStore((s) => s.handleSetting);
  const handleSettingMode = useAppStore((s) => s.handleSettingMode);
  const { t } = useTranslation();
  const [state, setState] = useState<StudyLangDialogState>({
    fullTranslationModeValue: ConfigService.getAllListConfig(
      "fullTranslationBooks"
    ).includes(currentBook?.key)
      ? ConfigService.getReaderConfig("fullTranslationMode") || ""
      : "",
    fullTranslationTargetValue:
      ConfigService.getReaderConfig("fullTranslationTarget") ||
      ConfigService.getReaderConfig("lang") ||
      "zhCN",
    isWordDefinition: ConfigService.getAllListConfig(
      "wordDefinitionBooks"
    ).includes(currentBook?.key),
    wordDefinitionLang: "",
    currentChineseLevel:
      ConfigService.getReaderConfig("currentChineseLevel") || "HSK3",
    currentJapaneseLevel:
      ConfigService.getReaderConfig("currentJapaneseLevel") || "N3",
    currentEnglishLevel:
      ConfigService.getReaderConfig("currentEnglishLevel") || "四级",
  });
  const stateRef = useLatest(state);
  const prevHtmlBookRef = useRef(htmlBook);
  const prevBookKeyRef = useRef(currentBook?.key);

  const mergeState = (patch: Partial<StudyLangDialogState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setState(stateRef.current);
  };

  const refreshWordDefinitionLang = async () => {
    if (!htmlBook?.rendition) return;
    try {
      const text = await htmlBook.rendition.audioText();
      if (text && text.length > 0) {
        mergeState({
          wordDefinitionLang: detectLocalLanguage(text.slice(0, 500).join(" ")),
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (stateRef.current.isWordDefinition) {
      refreshWordDefinitionLang();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentBook?.key !== prevBookKeyRef.current) {
      const isWordDefinition = ConfigService.getAllListConfig(
        "wordDefinitionBooks"
      ).includes(currentBook?.key);
      mergeState({
        fullTranslationModeValue: ConfigService.getAllListConfig(
          "fullTranslationBooks"
        ).includes(currentBook?.key)
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
      });
      if (isWordDefinition) {
        refreshWordDefinitionLang();
      }
    }
    prevBookKeyRef.current = currentBook?.key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBook?.key]);

  useEffect(() => {
    if (
      prevHtmlBookRef.current !== htmlBook &&
      stateRef.current.isWordDefinition &&
      !stateRef.current.wordDefinitionLang
    ) {
      refreshWordDefinitionLang();
    }
    prevHtmlBookRef.current = htmlBook;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlBook]);

  const handleFullTranslationChange = (value: string) => {
    mergeState({ fullTranslationModeValue: value });
    if (value === "no" || value === "") {
      ConfigService.deleteListConfig(
        currentBook.key,
        "fullTranslationBooks"
      );
    } else {
      if (!isAuthed) {
        mergeState({ fullTranslationModeValue: "no" });
        toast(t("Please upgrade to Pro to use this feature"));
        handleSetting(true);
        handleSettingMode("account");
        ConfigService.setReaderConfig("fullTranslationMode", "no");
        return;
      }
      ConfigService.setListConfig(
        currentBook.key,
        "fullTranslationBooks"
      );
    }
    toast.success(t("Setup successful"));
    renderBookFunc();
  };

  const handleWordDefinitionToggle = async () => {
    const next = !stateRef.current.isWordDefinition;
    if (next) {
      if (!isAuthed) {
        toast(t("Please upgrade to Pro to use this feature"));
        handleSetting(true);
        handleSettingMode("account");
        ConfigService.setReaderConfig("fullTranslationMode", "no");
        return;
      }
      if (ConfigService.getReaderConfig("isBionic") === "yes") {
        toast.error(
          t(
            "Word definitions and fast reading mode cannot be enabled at the same time"
          )
        );
        return;
      }
      const lang = await detectWordDefinitionLang();
      if (lang === "ko") {
        toast.error(
          t(
            "Unsupported language for word definition, currently only Chinese, Japanese and English are supported"
          )
        );
        return;
      }
      ConfigService.setListConfig(
        currentBook.key,
        "wordDefinitionBooks"
      );
      mergeState({
        isWordDefinition: true,
        wordDefinitionLang: lang,
      });
    } else {
      ConfigService.deleteListConfig(
        currentBook.key,
        "wordDefinitionBooks"
      );
      mergeState({
        isWordDefinition: false,
        wordDefinitionLang: "",
      });
    }
    toast(t("Change successful"));
    setTimeout(() => {
      renderBookFunc();
    }, 500);
  };

  const detectWordDefinitionLang = async () => {
    if (!htmlBook?.rendition) return "";
    try {
      const text = await htmlBook.rendition.audioText();
      if (text && text.length > 0) {
        return detectLocalLanguage(text.slice(0, 500).join(" "));
      }
    } catch (error) {
      console.error(error);
    }
    return "";
  };

  const renderWordLevelSelect = () => {
    if (!state.isWordDefinition) return null;
    if (
      state.wordDefinitionLang !== "zh" &&
      state.wordDefinitionLang !== "ja" &&
      state.wordDefinitionLang !== "en"
    ) {
      return null;
    }
    const langKey =
      state.wordDefinitionLang === "zh"
        ? "currentChineseLevel"
        : state.wordDefinitionLang === "ja"
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
          value={state[langKey as keyof StudyLangDialogState] as string}
          onChange={(event) => {
            const value = event.target.value;
            mergeState({ [langKey]: value } as Partial<StudyLangDialogState>);
            ConfigService.setReaderConfig(langKey, value);
            toast(t("Change successful"));
            renderBookFunc();
          }}
        >
          {levelItem.option.map((option, index) => (
            <option
              key={index}
              value={option.value}
              className="lang-setting-option"
            >
              {t(option.label)}
            </option>
          ))}
        </select>
      </div>
    );
  };

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
        handleStudyLangDialog(false);
      }}
      onMouseEnter={() => {
        handleStudyLangDialog(true);
      }}
      style={{
        top: "50px",
        width: "280px",
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
            value={state.fullTranslationModeValue}
            onChange={(event) => {
              handleFullTranslationChange(event.target.value);
            }}
          >
            {fullTranslationOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="lang-setting-option"
              >
                {t(option.label)}
              </option>
            ))}
          </select>
        </div>
        {(state.fullTranslationModeValue === "both" ||
          state.fullTranslationModeValue === "target") && (
          <div className="setting-dialog-new-title scale-page-preset-row">
            <span style={{ maxWidth: "120px" }}>
              <Trans>Target translation language</Trans>
            </span>
            <select
              className="lang-setting-dropdown"
              value={
                fullTranslationLangList.find(
                  (option) => option.code === state.fullTranslationTargetValue
                )?.code || state.fullTranslationTargetValue
              }
              onChange={(event) => {
                const value = event.target.value;
                mergeState({ fullTranslationTargetValue: value });
                ConfigService.setReaderConfig("fullTranslationTarget", value);
                toast(t("Change successful"));
                renderBookFunc();
              }}
            >
              {fullTranslationLangList.map((option) => (
                <option
                  key={option.code}
                  value={option.code}
                  className="lang-setting-option"
                >
                  {t(option.label)}
                </option>
              ))}
            </select>
          </div>
        )}
        <SwitchRow
          title={
            <>
              <Trans>Enable word definitions</Trans>
              <span style={{ fontSize: "13px", color: "#f16464" }}>
                {" "}
                (Pro)
              </span>
            </>
          }
          isEnabled={state.isWordDefinition}
          onClick={handleWordDefinitionToggle}
        />
        <p
          className="setting-option-subtitle"
          style={{ margin: "4px 0 0", fontSize: "13px", lineHeight: 1.5 }}
        >
          <Trans>
            {"Add definition next to the English, Chinese, Japanese words"}
          </Trans>
        </p>
        {renderWordLevelSelect()}
      </ul>
    </div>
  );
};

export default StudyLangDialog;
