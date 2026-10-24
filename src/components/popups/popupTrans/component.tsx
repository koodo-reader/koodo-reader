import React, { useEffect, useReducer, useRef, useState } from "react";
import "./popupTrans.css";
import { PopupTransProps, PopupTransState } from "./interface";
import {
  ConfigService,
  KookitConfig,
} from "../../../assets/lib/kookit-extra-browser.min";
import axios from "axios";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { getDefaultTransTarget, openExternalUrl } from "../../../utils/common";
import { getTransStream } from "../../../utils/request/reader";
import { chatStream } from "../../../utils/request/common";
import { getIframeDoc } from "../../../utils/reader/docUtil";
import { getBuiltinTranslation } from "../../../utils/plugins/rendererRegistry";
import type { PluginConfig } from "../../../utils/plugins/types";
import {
  executeCustomTranslation,
  isCustomRendererPlugin,
} from "../../../utils/plugins/customPlugin";

const PopupTrans = (props: PopupTransProps) => {
  const [state, setState] = useState<PopupTransState>({
    translatedText: "",
    originalText: "",
    transService: ConfigService.getReaderConfig("transService") || "",
    isAddNew: false,
    isFinishOutput: false,
    isAiWaiting: false,
  });
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const textAccumulator = useRef<string>("");
  const updateInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startUpdateInterval = () => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
    }
    updateInterval.current = setInterval(() => {
      if (textAccumulator.current) {
        setState((prev) => ({
          ...prev,
          translatedText: textAccumulator.current,
        }));
      }
    }, 150);
  };

  const stopUpdateInterval = () => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }
    if (textAccumulator.current) {
      setState((prev) => ({
        ...prev,
        translatedText: textAccumulator.current,
      }));
    }
  };

  const handleTrans = async (text: string) => {
    if (
      ConfigService.getReaderConfig("transService") &&
      ConfigService.getReaderConfig("transService") !==
        "official-ai-trans-plugin" &&
      ConfigService.getReaderConfig("transService") !== "custom-ai-trans-plugin"
    ) {
      let plugin = props.plugins.find(
        (item) => item.key === ConfigService.getReaderConfig("transService")
      );
      if (!plugin) {
        return;
      }
      const builtinTranslate = getBuiltinTranslation(plugin.key);
      const translate = builtinTranslate
        ? builtinTranslate
        : isCustomRendererPlugin(plugin)
          ? executeCustomTranslation(plugin)
          : undefined;
      if (!translate) return;
      translate(
        text,
        ConfigService.getReaderConfig("transSource") || "",
        ConfigService.getReaderConfig("transTarget") ||
          getDefaultTransTarget(plugin.langList),
        axios,
        plugin.config as PluginConfig
      )
        .then((res: string) => {
          if (res.startsWith("https://")) {
            openExternalUrl(res, true, "trans");
            let docs = getIframeDoc(props.currentBook);
            for (let i = 0; i < docs.length; i++) {
              let doc = docs[i];
              if (!doc) continue;
              doc.getSelection()?.empty();
            }
          } else {
            setState((prev) => ({
              ...prev,
              translatedText: res,
            }));
          }
        })
        .catch((err) => {
          toast.error(
            props.t("Translation failed") +
              ": " +
              (err instanceof Error ? err.message : String(err))
          );
          console.error(err);
        });
    } else if (
      ConfigService.getReaderConfig("transService") === "custom-ai-trans-plugin"
    ) {
      setState((prev) => ({
        ...prev,
        transService: "custom-ai-trans-plugin",
        isAddNew: false,
      }));
      let plugin = props.plugins.find(
        (item) => item.key === "custom-ai-trans-plugin"
      );
      if (!plugin) {
        return;
      }
      let targetLang =
        ConfigService.getReaderConfig("transTarget") ||
        getDefaultTransTarget(plugin.langList);
      if (targetLang === "Traditional Chinese") {
        targetLang = "繁体中文";
      }
      let systemPrompt =
        ConfigService.getReaderConfig("aiTranslatePrompt") ||
        KookitConfig.DefaultPrompts.aiTranslate;
      systemPrompt = systemPrompt.replace(
        "{from}",
        ConfigService.getReaderConfig("transSource") || "Automatic"
      );
      systemPrompt = systemPrompt.replace("{to}", targetLang);
      systemPrompt = systemPrompt.replace("{text}", text);
      let config: any = plugin.config || {};
      textAccumulator.current = "";
      setState((prev) => ({ ...prev, isAiWaiting: true }));
      startUpdateInterval();
      await chatStream(
        config.endpoint,
        config.providerId,
        config.apiKey,
        config.modelId,
        systemPrompt,
        [],
        (result) => {
          if (result && result.done) {
            return;
          }
          if (result && result.text) {
            if (!textAccumulator.current) {
              setState((prev) => ({ ...prev, isAiWaiting: false }));
            }
            textAccumulator.current += result.text;
          }
        }
      );
      stopUpdateInterval();
      textAccumulator.current = "";
      setState((prev) => ({
        ...prev,
        isFinishOutput: true,
        isAiWaiting: false,
      }));
    } else if (
      props.isAuthed &&
      ConfigService.getReaderConfig("isDisableAI") !== "yes"
    ) {
      setState((prev) => ({
        ...prev,
        transService: "official-ai-trans-plugin",
        isAddNew: false,
      }));
      let plugin = props.plugins.find(
        (item) => item.key === "official-ai-trans-plugin"
      );
      if (!plugin) {
        return;
      }
      let targetLang =
        ConfigService.getReaderConfig("transTarget") ||
        getDefaultTransTarget(plugin.langList);
      if (targetLang === "Traditional Chinese") {
        targetLang = "繁体中文";
      }
      textAccumulator.current = "";
      startUpdateInterval();
      await getTransStream(
        text,
        ConfigService.getReaderConfig("transSource") || "Automatic",
        ConfigService.getReaderConfig("transTarget") ||
          getDefaultTransTarget(plugin.langList),
        (result) => {
          if (result && result.done) {
            return;
          }
          if (result && result.text) {
            textAccumulator.current += result.text;
          }
        }
      );
      stopUpdateInterval();
      textAccumulator.current = "";
      setState((prev) => ({ ...prev, isFinishOutput: true }));
    }
  };

  // 让回调始终调用最新一次渲染的 handleTrans
  const handleTransRef = useRef(handleTrans);
  handleTransRef.current = handleTrans;

  // componentDidMount: 初始化翻译服务并发起首次翻译
  useEffect(() => {
    const originalText = props.originalText.replace(/(\r\n|\n|\r)/gm, "");
    setState((prev) => ({ ...prev, originalText }));
    (async () => {
      if (!state.transService) {
        let pluginList = props.plugins.filter(
          (item) =>
            item.type === "translation" && !item.key.startsWith("official-ai-")
        );
        if (pluginList.length > 0) {
          setState((prev) => ({ ...prev, transService: pluginList[0].key }));
          ConfigService.setReaderConfig("transService", pluginList[0].key);
          await new Promise((resolve) => setTimeout(resolve, 100));
        } else if (props.isAuthed) {
          setState((prev) => ({
            ...prev,
            transService: "official-ai-trans-plugin",
            isAddNew: false,
          }));
          ConfigService.setReaderConfig(
            "transService",
            "official-ai-trans-plugin"
          );
        } else {
          setState((prev) => ({ ...prev, isAddNew: true }));
        }
      }

      handleTransRef.current(originalText);
    })();
    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
        updateInterval.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UNSAFE_componentWillReceiveProps: originalText 变化时重新翻译
  const prevOriginalTextRef = useRef(props.originalText);
  useEffect(() => {
    const prevOriginalText = prevOriginalTextRef.current;
    prevOriginalTextRef.current = props.originalText;
    if (props.originalText !== prevOriginalText) {
      let originalText = props.originalText.replace(/(\r\n|\n|\r)/gm, "");
      setState((prev) => ({
        ...prev,
        originalText,
        translatedText: "",
      }));
      handleTransRef.current(originalText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.originalText]);

  const handleChangeService = (target: string) => {
    if (target === "official-ai-trans-plugin" && !props.isAuthed) {
      toast(props.t("Please upgrade to Pro to use this feature"));
      props.handleSetting(true);
      props.handleSettingMode("account");
      return;
    }
    setState((prev) => ({ ...prev, transService: target }));
    ConfigService.setReaderConfig("transService", target);
    let plugin = props.plugins.find((item) => item.key === target);
    if (!plugin) {
      return;
    }
    let autoValue = plugin.autoValue;
    ConfigService.setReaderConfig(
      "transTarget",
      getDefaultTransTarget(plugin?.langList)
    );
    ConfigService.setReaderConfig("transSource", autoValue);
    handleTrans(props.originalText.replace(/(\r\n|\n|\r)/gm, ""));
  };

  const renderNoteEditor = () => {
    return (
      <div className="trans-container">
        <div className="trans-service-selector-container">
          <div
            className="trans-service-selector-inactive"
            onClick={() => {
              props.handleOpenMenu(false);
              props.handleMenuMode("");
              props.handleSetting(true);
              props.handleSettingMode("plugins");
            }}
          >
            <span className="icon-add trans-add-icon"></span>
            <Trans>Add</Trans>
          </div>
          {props.plugins
            .filter((item) => item.type === "translation")
            .map((item) => {
              return (
                <div
                  className={
                    state.transService === item.key
                      ? "trans-service-selector"
                      : "trans-service-selector-inactive"
                  }
                  onClick={() => {
                    setState((prev) => ({ ...prev, isAddNew: false }));
                    handleChangeService(item.key);
                  }}
                >
                  <span className={`icon-${item.icon} trans-icon`}></span>
                  {props.t(item.displayName)}
                  {item.key === "official-ai-trans-plugin" && (
                    <span style={{ fontSize: "13px", color: "#f16464" }}>
                      {" "}
                      (Pro)
                    </span>
                  )}
                </div>
              );
            })}
        </div>
        {state.isAddNew && (
          <div
            style={{
              marginTop: "50px",
              textAlign: "center",
              fontSize: "17px",
              color: "#f16464",
            }}
          >
            <span
              style={{
                textDecoration: "underline",
                cursor: "pointer",
                textAlign: "center",
              }}
              onClick={() => {
                props.handleOpenMenu(false);
                props.handleMenuMode("");
                props.handleSetting(true);
                props.handleSettingMode("plugins");
              }}
            >
              <Trans>Add new plugin</Trans>
            </span>
          </div>
        )}
        {!state.isAddNew && (
          <>
            <div
              className="trans-box"
              style={
                props.isDockedRight
                  ? { flexDirection: "column", height: "calc(100% - 80px)" }
                  : undefined
              }
            >
              <div
                className="original-text-box"
                style={
                  props.isDockedRight
                    ? {
                        flex: 1,
                        minHeight: 0,
                        borderRight: "1px solid rgba(0,0,0,0.05)",
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                        borderBottomLeftRadius: 0,
                        borderTopRightRadius: "7px",
                      }
                    : undefined
                }
              >
                <div className="original-lang-box">
                  <select
                    className="original-lang-selector"
                    style={{ maxWidth: "120px", margin: 0 }}
                    value={ConfigService.getReaderConfig("transSource")}
                    onChange={(
                      event: React.ChangeEvent<HTMLSelectElement>
                    ) => {
                      let targetLang = event.target.value;
                      ConfigService.setReaderConfig("transSource", targetLang);
                      handleTrans(
                        props.originalText.replace(/(\r\n|\n|\r)/gm, "")
                      );
                      forceUpdate();
                    }}
                  >
                    {props.plugins.find(
                      (item) => item.key === state.transService
                    )?.langList &&
                      Object.keys(
                        props.plugins.find(
                          (item) => item.key === state.transService
                        )?.langList as any
                      ).map((item, index) => {
                        return (
                          <option
                            value={item}
                            key={index}
                            className="add-dialog-shelf-list-option"
                          >
                            {props.t(
                              Object.values(
                                props.plugins.find(
                                  (item) => item.key === state.transService
                                )?.langList as any[]
                              )[index]
                            )}
                          </option>
                        );
                      })}
                  </select>
                </div>
                <div className="original-text">{state.originalText}</div>
              </div>
              <div
                className="trans-text-box"
                style={
                  props.isDockedRight ? { flex: 1, minHeight: 0 } : undefined
                }
              >
                <div className="trans-lang-box">
                  <select
                    className="trans-lang-selector"
                    style={{ maxWidth: "120px", margin: 0 }}
                    value={
                      ConfigService.getReaderConfig("transTarget") ||
                      getDefaultTransTarget(
                        props.plugins.find(
                          (item) => item.key === state.transService
                        )?.langList
                      )
                    }
                    onChange={(
                      event: React.ChangeEvent<HTMLSelectElement>
                    ) => {
                      let targetLang = event.target.value;
                      ConfigService.setReaderConfig("transTarget", targetLang);
                      handleTrans(
                        props.originalText.replace(/(\r\n|\n|\r)/gm, "")
                      );
                      forceUpdate();
                    }}
                  >
                    {props.plugins.find(
                      (item) => item.key === state.transService
                    )?.langList &&
                      Object.keys(
                        props.plugins.find(
                          (item) => item.key === state.transService
                        )?.langList as any
                      ).map((item, index) => {
                        return (
                          <option
                            value={item}
                            key={index}
                            className="add-dialog-shelf-list-option"
                          >
                            {props.t(
                              Object.values(
                                props.plugins.find(
                                  (item) => item.key === state.transService
                                )?.langList as any[]
                              )[index]
                            )}
                          </option>
                        );
                      })}
                  </select>
                </div>
                <div className="trans-text">
                  {state.isAiWaiting && !state.translatedText ? (
                    <div className="dict-ai-answer-waiting">
                      <span className="icon-loading popup-assistant-loading"></span>
                      <span>{props.t("Thinking, please wait...")}</span>
                    </div>
                  ) : (
                    state.translatedText
                  )}
                  {state.transService.includes("ai-trans") &&
                    state.isFinishOutput && (
                      <p
                        className="dict-learn-more"
                        style={{ color: "#f16464" }}
                      >
                        {props.t("Generated with AI")}
                      </p>
                    )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return renderNoteEditor();
};
export default PopupTrans;
