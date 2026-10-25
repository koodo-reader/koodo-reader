import { useLatest } from "../../../utils/hooks/useLatest";
import { useTranslation } from "react-i18next";
import React, { useEffect, useRef, useState } from "react";
import "./popupAssist.css";
import {
  ConfigService,
  KookitConfig,
} from "../../../assets/lib/kookit-extra-browser.min";
import Parser from "html-react-parser";
import DOMPurify from "dompurify";
import { Trans } from "react-i18next";
import {
  handleContextMenu,
  REPORT_REASONS,
  vexSelectAsync,
} from "../../../utils/common";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";
import { getAnswerStream } from "../../../utils/request/reader";
import { chatStream, llmReport } from "../../../utils/request/common";
import { marked } from "marked";
import { sampleQuestion } from "../../../constants/settingList";
import { useAppStore } from "../../../store/useAppStore";

export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export interface PopupAssistProps {
  isDockedRight: boolean;
}

export interface PopupAssistState {
  aiService: string;
  isAddNew: boolean;
  isWaiting: boolean;
  question: string;
  askHistory: AiChatMessage[];
  chatHistory: AiChatMessage[];
  answer: string;
  mode: string;
  inputQuestion: string;
}

const MAX_HISTORY_LENGTH = 50;
const AI_ASK_HISTORY_KEY = "aiAskHistory";
const AI_CHAT_HISTORY_KEY = "aiChatHistory";
const HISTORY_KEY_BY_MODE: Record<string, string> = {
  ask: AI_ASK_HISTORY_KEY,
  chat: AI_CHAT_HISTORY_KEY,
};

const PopupAssist = (props: PopupAssistProps) => {
  const currentBook = useAppStore((s) => s.book.currentBook);
  const originalText = useAppStore((s) => s.reader.originalText);
  const quoteText = useAppStore((s) => s.reader.quoteText);
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const plugins = useAppStore((s) => s.manager.plugins);
  const isAuthed = useAppStore((s) => s.manager.isAuthed);
  const userInfo = useAppStore((s) => s.manager.userInfo);
  const handleOpenMenu = useAppStore((s) => s.handleOpenMenu);
  const handleMenuMode = useAppStore((s) => s.handleMenuMode);
  const handleSetting = useAppStore((s) => s.handleSetting);
  const handleSettingMode = useAppStore((s) => s.handleSettingMode);
  const handleQuoteText = useAppStore((s) => s.handleQuoteText);
  const { t } = useTranslation();
  const [state, setState] = useState<PopupAssistState>({
    answer: "",
    aiService: ConfigService.getReaderConfig("aiService") || "",
    isAddNew: false,
    isWaiting: false,
    question: "",
    chatHistory: [],
    askHistory: [],
    mode: "ask",
    inputQuestion: "",
  });

  const stateRef = useLatest(state);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const answerTextAccumulator = useRef("");
  const updateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHydrating = useRef(false);
  const pendingTimeouts = useRef<Set<ReturnType<typeof setTimeout>>>(
    new Set()
  );

  const mergeState = (patch: Partial<PopupAssistState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  };

  const runAfterUpdate = (callback: () => void) => {
    const id = setTimeout(() => {
      pendingTimeouts.current.delete(id);
      callback();
    }, 0);
    pendingTimeouts.current.add(id);
  };

  const loadHistory = (
    bookKey: string,
    mode: "ask" | "chat"
  ): AiChatMessage[] => {
    if (!bookKey) {
      return [];
    }
    const key = HISTORY_KEY_BY_MODE[mode];
    return ConfigService.getObjectConfig(bookKey, key, []);
  };

  const clearHistory = (bookKey: string, mode: "ask" | "chat"): void => {
    if (!bookKey) {
      return;
    }
    const key = HISTORY_KEY_BY_MODE[mode];
    ConfigService.setObjectConfig(bookKey, [], key);
  };

  const saveHistory = (
    bookKey: string,
    mode: "ask" | "chat",
    messages: AiChatMessage[]
  ): void => {
    if (!bookKey) {
      return;
    }
    const key = HISTORY_KEY_BY_MODE[mode];
    const trimmed =
      messages.length <= MAX_HISTORY_LENGTH
        ? messages
        : messages.slice(messages.length - MAX_HISTORY_LENGTH);
    ConfigService.setObjectConfig(bookKey, trimmed, key);
  };

  const startUpdateInterval = () => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
    }
    updateInterval.current = setInterval(() => {
      if (answerTextAccumulator.current) {
        setState((prev) => ({ ...prev, answer: answerTextAccumulator.current }));
        runAfterUpdate(scrollToBottomIfNeeded);
      }
    }, 150);
  };

  const stopUpdateInterval = (
    finalAnswer?: string,
    callback?: () => void
  ) => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }
    if (finalAnswer !== undefined) {
      setState((prev) => ({ ...prev, answer: finalAnswer }));
      if (callback) runAfterUpdate(callback);
    } else {
      callback?.();
    }
  };
  const loadChatHistory = () => {
    const bookKey = currentBook?.key;
    if (!bookKey) {
      return;
    }
    isHydrating.current = true;
    setState((prev) => ({
      ...prev,
      askHistory: loadHistory(bookKey, "ask"),
      chatHistory: loadHistory(bookKey, "chat"),
    }));
    runAfterUpdate(() => {
      isHydrating.current = false;
      if (ConfigService.getReaderConfig("isManualScroll") !== "yes") {
        scrollToBottom();
      }
    });
  };
  const saveChatHistory = () => {
    const bookKey = currentBook?.key;
    if (!bookKey || isHydrating.current) {
      return;
    }
    saveHistory(bookKey, "ask", stateRef.current.askHistory);
    saveHistory(bookKey, "chat", stateRef.current.chatHistory);
  };
  // componentDidMount: 加载历史、处理引用文本、初始化 AI 服务
  useEffect(() => {
    loadChatHistory();
    if (quoteText) {
      setState((prev) => ({ ...prev, inputQuestion: quoteText + "\n" }));
      runAfterUpdate(() => {
        autoResizeTextarea();
        const el = textareaRef.current;
        if (el) {
          el.focus();
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
      });
      handleQuoteText("");
    }
    if (!state.aiService) {
      let pluginList = plugins.filter(
        (item) =>
          item.type === "assistant" && !item.key.startsWith("official-ai-")
      );
      if (pluginList.length > 0) {
        mergeState({
          aiService: pluginList[0].key,
        });
        ConfigService.setReaderConfig("aiService", pluginList[0].key);
      } else if (isAuthed) {
        mergeState({
          aiService: "official-ai-assistant-plugin",
          isAddNew: false,
        });
        ConfigService.setReaderConfig(
          "aiService",
          "official-ai-assistant-plugin"
        );
      } else {
        mergeState({
          isAddNew: true,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // componentDidUpdate: 书籍变化时重新加载历史
  const prevBookKeyRef = useRef(currentBook?.key);
  useEffect(() => {
    if (prevBookKeyRef.current !== currentBook?.key) {
      prevBookKeyRef.current = currentBook?.key;
      loadChatHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBook?.key]);

  // componentDidUpdate: 历史变化时持久化
  useEffect(() => {
    if (isHydrating.current) {
      return;
    }
    const bookKey = currentBook?.key;
    if (!bookKey) {
      return;
    }
    saveHistory(bookKey, "ask", state.askHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.askHistory]);

  useEffect(() => {
    if (isHydrating.current) {
      return;
    }
    const bookKey = currentBook?.key;
    if (!bookKey) {
      return;
    }
    saveHistory(bookKey, "chat", state.chatHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.chatHistory]);

  // componentWillUnmount: 保存历史并清理定时器
  useEffect(() => {
    return () => {
      saveChatHistory();
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
        updateInterval.current = null;
      }
      pendingTimeouts.current.forEach((id) => clearTimeout(id));
      pendingTimeouts.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    const style = getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;
    const maxLines = 5;
    const maxHeight = lineHeight * maxLines + paddingTop + paddingBottom;
    // 先重置为最小高度，让 scrollHeight 反映真实内容高度
    el.style.height = "0px";
    const contentHeight = el.scrollHeight;
    if (contentHeight >= maxHeight) {
      el.style.height = maxHeight + "px";
      el.style.overflowY = "auto";
    } else {
      el.style.height = contentHeight + "px";
      el.style.overflowY = "hidden";
    }
  };
  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      const scrollHeight = chatBoxRef.current.scrollHeight;
      const height = chatBoxRef.current.clientHeight;
      const maxScrollTop = scrollHeight - height;
      chatBoxRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }
  };
  const scrollToBottomIfNeeded = () => {
    if (ConfigService.getReaderConfig("isManualScroll") !== "yes") {
      scrollToBottom();
    }
  };
  const handleAnswer = async () => {
    let answerText =
      stateRef.current.mode === "ask"
        ? originalText
            .replace(/(\r\n|\n|\r)/gm, "")
            .replace(/-/gm, "")
            // Remove common garbage characters
            .replace(
              /[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u4E00-\u9FFF\u3000-\u303F]/g,
              ""
            )
            // Remove consecutive spaces
            .replace(/\s{2,}/g, " ")
            .trim()
        : "";
    if (
      (!ConfigService.getReaderConfig("aiService") ||
        plugins.findIndex(
          (item) => item.key === ConfigService.getReaderConfig("aiService")
        ) === -1) &&
      !isAuthed
    ) {
      mergeState({ isAddNew: true });
    }
    if (stateRef.current.mode === "ask" && !answerText) {
      answerText = await htmlBook.rendition.chapterText();
    }
    handleDoAnswer(answerText);
  };
  const handleDoAnswer = async (text: string) => {
    try {
      if (
        ConfigService.getReaderConfig("aiService") &&
        ConfigService.getReaderConfig("aiService") ===
          "custom-ai-assistant-plugin"
      ) {
        let plugin = plugins.find(
          (item) => item.key === "custom-ai-assistant-plugin"
        );
        if (!plugin) {
          return;
        }
        let systemPrompt =
          ConfigService.getReaderConfig("aiAssistancePrompt") ||
          KookitConfig.DefaultPrompts.aiAssistance;
        if (stateRef.current.mode === "ask") {
          systemPrompt = systemPrompt.replace("{text}", text);
        } else {
          systemPrompt = systemPrompt.replace("{text}", "");
        }
        let config: any = plugin.config || {};
        let chatHistory =
          stateRef.current.mode === "ask"
            ? stateRef.current.askHistory
            : stateRef.current.chatHistory;
        // Build messages: system prompt as first user message, then history, then current question
        const historyMessages = chatHistory.slice(0, -1); // exclude the latest user message we just added
        const currentQuestion =
          chatHistory[chatHistory.length - 1]?.content ||
          stateRef.current.question;
        if (!currentQuestion) {
          return;
        }
        answerTextAccumulator.current = "";
        startUpdateInterval();
        await chatStream(
          config.endpoint,
          config.providerId,
          config.apiKey,
          config.modelId,
          systemPrompt + "\n\nUser question: " + currentQuestion,
          historyMessages,
          (result) => {
            if (result && result.done) {
              return;
            }
            if (result && result.text) {
              if (!answerTextAccumulator.current) {
                mergeState({ isWaiting: false });
              }
              answerTextAccumulator.current += result.text;
            }
          }
        );
        stopUpdateInterval(answerTextAccumulator.current);
        const finalAnswer = answerTextAccumulator.current;
        answerTextAccumulator.current = "";
        if (stateRef.current.mode === "ask") {
          setState((prev) => ({
            ...prev,
            askHistory: [
              ...prev.askHistory,
              { role: "assistant", content: finalAnswer },
            ],
            answer: "",
            question: "",
            isWaiting: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            chatHistory: [
              ...prev.chatHistory,
              { role: "assistant", content: finalAnswer },
            ],
            answer: "",
            question: "",
            isWaiting: false,
          }));
        }
        runAfterUpdate(scrollToBottomIfNeeded);
      } else if (
        ConfigService.getReaderConfig("aiService") &&
        ConfigService.getReaderConfig("aiService") !==
          "official-ai-assistant-plugin"
      ) {
      } else if (isAuthed) {
        let plugin = plugins.find(
          (item) => item.key === "official-ai-assistant-plugin"
        );
        if (!plugin) {
          return;
        }
        answerTextAccumulator.current = "";
        startUpdateInterval();
        let res = await getAnswerStream(
          text,
          stateRef.current.question,
          stateRef.current.mode === "ask"
            ? stateRef.current.askHistory
            : stateRef.current.chatHistory,
          stateRef.current.mode,
          (result) => {
            if (result && result.text) {
              if (!answerTextAccumulator.current) {
                mergeState({ isWaiting: false });
              }
              answerTextAccumulator.current += result.text;
            }
          }
        );
        const isAnswerDone = !!(res.data && res.done);
        stopUpdateInterval(
          answerTextAccumulator.current,
          isAnswerDone ? undefined : scrollToBottomIfNeeded
        );
        const finalAnswer = answerTextAccumulator.current;
        answerTextAccumulator.current = "";
        if (isAnswerDone) {
          if (stateRef.current.mode === "ask") {
            setState((prev) => ({
              ...prev,
              askHistory: [
                ...prev.askHistory,
                {
                  role: "assistant",
                  content: finalAnswer,
                },
              ],
              answer: "",
              question: "",
              isWaiting: false,
            }));
          } else {
            setState((prev) => ({
              ...prev,
              chatHistory: [
                ...prev.chatHistory,
                {
                  role: "assistant",
                  content: finalAnswer,
                },
              ],
              answer: "",
              question: "",
              isWaiting: false,
            }));
          }
          runAfterUpdate(scrollToBottomIfNeeded);
        }
      }
    } catch (error) {
      toast.error(
        t("Error happened") +
          ": " +
          (error instanceof Error ? error.message : String(error))
      );
      console.error(error);
      mergeState({
        answer: t("Error happened"),
      });
    }
  };
  const handleChangeAiService = (aiService: string) => {
    if (aiService === "official-ai-assistant-plugin" && !isAuthed) {
      toast(t("Please upgrade to Pro to use this feature"));
      handleSetting(true);
      handleSettingMode("account");
      return;
    }
    let plugin = plugins.find((item) => item.key === aiService);
    if (!plugin) {
      return;
    }
    mergeState({
      aiService: aiService,
      isAddNew: false,
    });
    runAfterUpdate(() => {
      ConfigService.setReaderConfig("aiService", aiService);
      if (!plugin) return;
      handleAnswer();
    });
  };
  const handleCopyAnswer = (content: string) => {
    navigator.clipboard.writeText(content || "").then(() => {
      toast.success(t("Copied"));
    });
  };
  const handleReportAnswer = async (content: string, index: number) => {
    const history =
      stateRef.current.mode === "ask"
        ? stateRef.current.askHistory
        : stateRef.current.chatHistory;
    const userMessage = history
      .slice(0, index)
      .reverse()
      .find((item) => item.role === "user");
    const reason = await vexSelectAsync(
      "Report reason",
      REPORT_REASONS.map((item) => ({ value: item, label: item }))
    );
    if (!reason) {
      return;
    }
    toast.loading(t("Please wait"), { id: "report-feedback" });
    try {
      await llmReport({
        answer: content,
        question: userMessage?.content || "",
        reason: t(reason),
        user_id: (userInfo?.time_created || "") + "" || "anonymous",
      });
      toast.success(t("Thank you for your feedback"), {
        id: "report-feedback",
      });
    } catch (error) {
      toast.success(t("Thank you for your feedback"), {
        id: "report-feedback",
      });
    }
  };
  const handleRenderHistoryMessage = (message: any[]) => {
    return message.map((item, index) => {
      return (
        <div
          key={index}
          className={
            item.role === "assistant"
              ? "popup-message-assistant"
              : "popup-message-user"
          }
        >
          {Parser(
            DOMPurify.sanitize(
              marked.parse(item.content) + "<address></address>"
            ) || " ",
            {
              replace: (_domNode) => {},
            }
          )}
          {item.role === "assistant" && (
            <div
              className="popup-assist-copy-button"
              onClick={() => handleCopyAnswer(item.content)}
            >
              <span className="icon-copy-line"></span>
            </div>
          )}
          {item.role === "assistant" && (
            <div
              className="popup-assist-copy-button popup-assist-report-button"
              onClick={() => handleReportAnswer(item.content, index)}
            >
              <span className="icon-report" style={{ fontWeight: 500 }}></span>
            </div>
          )}
          {item.role === "assistant" && index === message.length - 1 && (
            <div className="popup-assist-disclaimer">
              {t(
                "AI-generated content is for reference only. Please verify carefully as it does not constitute professional advice."
              )}
            </div>
          )}
        </div>
      );
    });
  };
  const handleExportChatHistory = () => {
    const messages =
      stateRef.current.mode === "ask"
        ? stateRef.current.askHistory
        : stateRef.current.chatHistory;
    if (messages.length === 0) {
      toast(t("Nothing to export"));
      return;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dateStr = `${year}-${month <= 9 ? "0" + month : month}-${
      day <= 9 ? "0" + day : day
    }`;
    const modeLabel = stateRef.current.mode === "ask" ? "Reading" : "Chat";
    const bookName = currentBook?.name || "Unknown";
    const exportData = {
      bookName,
      mode: stateRef.current.mode,
      exportedAt: now.toISOString(),
      messages,
    };
    saveAs(
      new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json;charset=UTF-8",
      }),
      `KoodoReader-${modeLabel}-Assistant-${bookName}-${dateStr}.json`
    );
    toast.success(t("Export successful"), { id: "exporting" });
  };
  const handleDeleteChatHistory = () => {
    clearHistory(
      currentBook?.key || "",
      stateRef.current.mode as "ask" | "chat"
    );
    toast.success(t("Deletion successful"));
    if (stateRef.current.mode === "ask") {
      setState((prev) => ({ ...prev, askHistory: [] }));
    } else {
      setState((prev) => ({ ...prev, chatHistory: [] }));
    }
  };
  const handleSendQuestion = () => {
    const { answer, isWaiting, inputQuestion } = stateRef.current;
    if (answer || isWaiting) {
      return;
    }
    handleNewQuestion(inputQuestion);
    mergeState({ inputQuestion: "" });
    runAfterUpdate(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = "40px";
        el.style.overflowY = "hidden";
      }
    });
  };
  const handleNewQuestion = (question: string) => {
    const content = t(question);
    if (stateRef.current.mode === "ask") {
      setState((prev) => ({
        ...prev,
        askHistory: [
          ...prev.askHistory,
          {
            role: "user",
            content,
          },
        ],
        question: content,
        answer: "",
        isWaiting: true,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        chatHistory: [
          ...prev.chatHistory,
          {
            role: "user",
            content,
          },
        ],
        question: content,
        answer: t(""),
        isWaiting: true,
      }));
    }
    runAfterUpdate(handleAnswer);
    setTimeout(() => {
      if (ConfigService.getReaderConfig("isManualScroll") !== "yes") {
        scrollToBottom();
      }
    }, 100);
  };
  return (
      <div className="dict-container">
        <div
          className="dict-service-container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "calc(100% - 50px)",
            top: "20px",
            flexWrap: props.isDockedRight ? "wrap" : "nowrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: props.isDockedRight
                ? "space-between"
                : "flex-start",
              flexShrink: 0,
              width: props.isDockedRight ? "100%" : undefined,
              marginTop: props.isDockedRight ? "10px" : "0px",
            }}
          >
            <div
              className={
                state.mode === "ask"
                  ? "trans-service-selector"
                  : "trans-service-selector-inactive"
              }
              onClick={() => {
                mergeState({ isAddNew: false, mode: "ask" });
              }}
              style={{ width: props.isDockedRight ? "50%" : undefined }}
            >
              <span className={`icon-bookmark trans-icon`}></span>
              {t("Reading Assistant")}
            </div>
            <div
              className={
                state.mode === "chat"
                  ? "trans-service-selector"
                  : "trans-service-selector-inactive"
              }
              onClick={() => {
                mergeState({ isAddNew: false, mode: "chat" });
              }}
              style={{
                width: props.isDockedRight ? "50%" : undefined,
                marginRight: props.isDockedRight ? "0px" : "10px",
              }}
            >
              <span className={`icon-idea trans-icon`}></span>
              {t("Chat Assistant")}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: props.isDockedRight ? "100%" : undefined,
              justifyContent: props.isDockedRight
                ? "space-between"
                : undefined,
              marginTop: props.isDockedRight ? "10px" : "0px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                className="popup-assist-export-button"
                style={{ fontSize: 18 }}
                onClick={handleDeleteChatHistory}
              >
                <span
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content={t("Clear chat history")}
                >
                  <span className="icon-trash-line"></span>
                </span>
              </div>
              <div
                className="popup-assist-export-button"
                onClick={handleExportChatHistory}
              >
                <span
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content={t("Export chat history")}
                >
                  <span className="icon-share"></span>
                </span>
              </div>
            </div>

            <select
              className="dict-service-selector"
              style={{
                margin: 0,
                color: "#f16464",
                width: "150px",
              }}
              value={state.aiService}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                if (event.target.value === "add-new") {
                  handleOpenMenu(false);
                  handleMenuMode("");
                  handleSetting(true);
                  handleSettingMode("ai");
                  return;
                }
                handleChangeAiService(event.target.value);
              }}
            >
              <option
                value={""}
                key={"select"}
                className="add-dialog-shelf-list-option"
              >
                {t("Please select")}
              </option>
              {plugins
                .filter((item) => item.type === "assistant")
                .map((item) => {
                  return (
                    <option
                      value={item.key}
                      key={item.key}
                      className="add-dialog-shelf-list-option"
                    >
                      {t(item.displayName)}
                      {item.key === "official-ai-assistant-plugin" && (
                        <span style={{ fontSize: "13px", color: "#f16464" }}>
                          {" "}
                          (Pro)
                        </span>
                      )}
                    </option>
                  );
                })}
              <option
                value={"add-new"}
                key={"add-new"}
                className="add-dialog-shelf-list-option"
              >
                {t("Add new plugin")}
              </option>
            </select>
          </div>
        </div>

        {state.isAddNew && (
          <div
            style={{
              marginTop: "150px",
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
                handleOpenMenu(false);
                handleMenuMode("");
                handleSetting(true);
                handleSettingMode("ai");
              }}
            >
              <Trans>Add new plugin</Trans>
            </span>
          </div>
        )}
        {!state.isAddNew && (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                paddingTop: props.isDockedRight ? "100px" : "60px",
                paddingBottom: "20px",
                boxSizing: "border-box",
              }}
            >
              <div
                className="dict-text-box"
                style={{
                  flex: 1,
                  marginTop: "0px",
                  width: "calc(100% + 20px)",
                  height: undefined,
                  paddingBottom: "0px",
                  paddingLeft: "0px",
                  paddingRight: "20px",
                }}
                ref={chatBoxRef}
              >
                {handleRenderHistoryMessage(
                  state.mode === "ask"
                    ? state.askHistory
                    : state.chatHistory
                )}
                {state.isWaiting ? (
                  <div
                    className="popup-message-assistant"
                    style={{ float: "left" }}
                  >
                    <span
                      className="icon-loading popup-assistant-loading"
                      style={{
                        marginRight: "10px",
                        marginTop: "5px",
                      }}
                    ></span>
                    <span>{t("Thinking, please wait...")}</span>
                  </div>
                ) : (state.mode === "ask"
                    ? state.askHistory
                    : state.chatHistory
                  ).length > 0 ? (
                  <div className="popup-message-assistant">
                    {Parser(
                      DOMPurify.sanitize(
                        marked.parse(
                          state.answer ? state.answer : ""
                        ) + "<address></address>"
                      ) || " ",
                      {
                        replace: (_domNode) => {},
                      }
                    )}
                  </div>
                ) : (
                  <div className="popup-message-assistant">
                    {state.mode === "ask"
                      ? t(
                          "Hi there! What questions do you have about this chapter?"
                        )
                      : t(
                          "Hi there! I'm happy to help with any questions about reading or learning"
                        )}
                  </div>
                )}
              </div>
              <div
                style={{
                  marginLeft: "-25px",
                  marginRight: "-25px",
                  marginBottom: "0px",
                  padding: "0px 25px",
                }}
              >
                <div className="popup-assist-shortcut-container">
                  {sampleQuestion
                    .filter((item) => item.mode === state.mode)
                    .map((item) => {
                      return (
                        <div
                          className="popup-assist-shortcut"
                          onClick={() => {
                            handleNewQuestion(item.question);
                          }}
                        >
                          {item.emoji + " " + t(item.question)}
                        </div>
                      );
                    })}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    name="url"
                    placeholder={t(
                      state.mode === "ask"
                        ? "Ask anything about this chapter"
                        : "Ask anything about reading or learning"
                    )}
                    id="trans-add-content-box"
                    className="trans-add-content-box"
                    style={{
                      height: "40px",
                      resize: "none",
                      overflowY: "hidden",
                      marginRight: "10px",
                      marginBottom: "0px",
                    }}
                    onKeyDown={(
                      event: React.KeyboardEvent<HTMLTextAreaElement>
                    ) => {
                      if (
                        event.key === "Enter" &&
                        (event.ctrlKey || event.metaKey) &&
                        !(event.nativeEvent as any).isComposing
                      ) {
                        event.preventDefault();
                        handleSendQuestion();
                      }
                    }}
                    onContextMenu={() => {
                      handleContextMenu("trans-add-content-box");
                    }}
                    value={state.inputQuestion}
                    onChange={(
                      event: React.ChangeEvent<HTMLTextAreaElement>
                    ) => {
                      mergeState({ inputQuestion: event.target.value });
                      runAfterUpdate(autoResizeTextarea);
                    }}
                  />
                  <div
                    className="popup-assistant-send-button"
                    onClick={handleSendQuestion}
                  >
                    {t("Send")}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
  );
};
export default PopupAssist;
