import React from "react";
import "./popupAssist.css";
import { PopupAssistProps, PopupAssistState } from "./interface";
import {
  ConfigService,
  KookitConfig,
} from "../../../assets/lib/kookit-extra-browser.min";
import Parser from "html-react-parser";
import DOMPurify from "dompurify";
import { Trans } from "react-i18next";
import { handleContextMenu } from "../../../utils/common";
import toast from "react-hot-toast";
import { getAnswerStream } from "../../../utils/request/reader";
import { chatStream } from "../../../utils/request/common";
import { marked } from "marked";
import { sampleQuestion } from "../../../constants/settingList";
class PopupAssist extends React.Component<PopupAssistProps, PopupAssistState> {
  private chatBoxRef: React.RefObject<HTMLDivElement>;

  constructor(props: PopupAssistProps) {
    super(props);
    this.state = {
      answer: "",
      aiService: ConfigService.getReaderConfig("aiService") || "",
      isAddNew: false,
      isWaiting: false,
      question: "",
      chatHistory: [],
      askHistory: [],
      mode: "ask",
      inputQuestion: "",
    };
    this.chatBoxRef = React.createRef();
  }
  componentDidMount(): void {
    if (!this.state.aiService) {
      let pluginList = this.props.plugins.filter(
        (item) => item.type === "assistant"
      );
      if (pluginList.length > 0) {
        this.setState({
          aiService: pluginList[0].key,
        });
        ConfigService.setReaderConfig("aiService", pluginList[0].key);
      } else {
        this.setState({
          isAddNew: true,
        });
      }
    }
  }
  scrollToBottom = () => {
    if (this.chatBoxRef.current) {
      const scrollHeight = this.chatBoxRef.current.scrollHeight;
      const height = this.chatBoxRef.current.clientHeight;
      const maxScrollTop = scrollHeight - height;
      this.chatBoxRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }
  };
  async handleAnswer() {
    let originalText =
      this.state.mode === "ask"
        ? this.props.originalText
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
      (!this.state.aiService ||
        this.props.plugins.findIndex(
          (item) => item.key === this.state.aiService
        ) === -1) &&
      !this.props.isAuthed
    ) {
      this.setState({ isAddNew: true });
    }
    this.handleDoAnswer(originalText);
  }
  handleDoAnswer = async (text: string) => {
    try {
      if (
        this.state.aiService &&
        this.state.aiService === "custom-ai-assistant-plugin"
      ) {
        let plugin = this.props.plugins.find(
          (item) => item.key === "custom-ai-assistant-plugin"
        );
        if (!plugin) {
          return;
        }
        let isFirst = true;
        let systemPrompt =
          ConfigService.getReaderConfig("aiAssistancePrompt") ||
          KookitConfig.DefaultPrompts.aiAssistance;
        if (this.state.mode === "ask") {
          systemPrompt = systemPrompt.replace("{text}", text);
        } else {
          systemPrompt = systemPrompt.replace("{text}", "");
        }
        let config: any = plugin.config || {};
        let chatHistory =
          this.state.mode === "ask"
            ? this.state.askHistory
            : this.state.chatHistory;
        // Build messages: system prompt as first user message, then history, then current question
        const historyMessages = chatHistory.slice(0, -1); // exclude the latest user message we just added
        const currentQuestion =
          chatHistory[chatHistory.length - 1]?.content || this.state.question;
        if (!currentQuestion) {
          return;
        }
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
              if (isFirst) {
                this.setState({ answer: result.text, isWaiting: false });
                isFirst = false;
              } else {
                this.setState({
                  answer: this.state.answer + result.text,
                });
              }
            }
            if (ConfigService.getReaderConfig("isManualScroll") !== "yes") {
              this.scrollToBottom();
            }
          }
        );
        if (this.state.mode === "ask") {
          this.setState({
            askHistory: [
              ...this.state.askHistory,
              { role: "assistant", content: this.state.answer },
            ],
            answer: "",
            question: "",
            isWaiting: false,
          });
        } else {
          this.setState({
            chatHistory: [
              ...this.state.chatHistory,
              { role: "assistant", content: this.state.answer },
            ],
            answer: "",
            question: "",
            isWaiting: false,
          });
        }
        if (ConfigService.getReaderConfig("isManualScroll") !== "yes") {
          this.scrollToBottom();
        }
      } else if (
        this.state.aiService &&
        this.state.aiService !== "official-ai-assistant-plugin"
      ) {
      } else if (this.props.isAuthed) {
        let plugin = this.props.plugins.find(
          (item) => item.key === "official-ai-assistant-plugin"
        );
        if (!plugin) {
          return;
        }
        let isFirst = true;
        let res = await getAnswerStream(
          text,
          this.state.question,
          this.state.mode === "ask"
            ? this.state.askHistory
            : this.state.chatHistory,
          this.state.mode,
          (result) => {
            if (result && result.text) {
              if (isFirst) {
                this.setState({
                  answer: result.text,
                  isWaiting: false,
                });
                isFirst = false;
              } else {
                this.setState({
                  answer: this.state.answer + result.text,
                });
              }
            }
            if (ConfigService.getReaderConfig("isManualScroll") !== "yes") {
              this.scrollToBottom();
            }
          }
        );
        if (res.data && res.done) {
          if (this.state.mode === "ask") {
            this.setState({
              askHistory: [
                ...this.state.askHistory,
                {
                  role: "assistant",
                  content: this.state.answer,
                },
              ],
              answer: "",
              question: "",
              isWaiting: false,
            });
          } else {
            this.setState({
              chatHistory: [
                ...this.state.chatHistory,
                {
                  role: "assistant",
                  content: this.state.answer,
                },
              ],
              answer: "",
              question: "",
              isWaiting: false,
            });
          }
        }
        // if (res.code === 20006) {
        //   this.setState({
        //     isWaiting: false,
        //     answer: "",
        //     question: "",
        //   });
        // }
        if (ConfigService.getReaderConfig("isManualScroll") !== "yes") {
          this.scrollToBottom();
        }
      }
    } catch (error) {
      toast.error(
        this.props.t("Error happened") +
          ": " +
          (error instanceof Error ? error.message : String(error))
      );
      console.error(error);
      this.setState({
        answer: this.props.t("Error happened"),
      });
    }
  };
  handleChangeAiService = (aiService: string) => {
    let plugin = this.props.plugins.find((item) => item.key === aiService);
    if (!plugin) {
      return;
    }
    this.setState(
      {
        aiService: aiService,
        isAddNew: false,
      },
      () => {
        ConfigService.setReaderConfig("aiService", aiService);
        if (!plugin) return;
        this.handleAnswer();
      }
    );
  };
  handleRenderHistoryMessage = (message: any[]) => {
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
        </div>
      );
    });
  };
  handleNewQuestion = (question: string) => {
    if (this.state.mode === "ask") {
      this.setState(
        {
          askHistory: [
            ...this.state.askHistory,
            {
              role: "user",
              content: this.props.t(question),
            },
          ],
          question: this.props.t(question),
          answer: "",
          isWaiting: true,
        },
        () => {
          this.handleAnswer();
        }
      );
    } else {
      this.setState(
        {
          chatHistory: [
            ...this.state.chatHistory,
            {
              role: "user",
              content: this.props.t(question),
            },
          ],
          question: this.props.t(question),
          answer: this.props.t(""),
          isWaiting: true,
        },
        () => {
          this.handleAnswer();
        }
      );
    }
    setTimeout(() => {
      if (ConfigService.getReaderConfig("isManualScroll") !== "yes") {
        this.scrollToBottom();
      }
    }, 100);
  };
  render() {
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
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <div
              className={
                this.state.mode === "ask"
                  ? "trans-service-selector"
                  : "trans-service-selector-inactive"
              }
              onClick={() => {
                this.setState({ isAddNew: false, mode: "ask" });
              }}
            >
              <span className={`icon-bookmark trans-icon`}></span>
              {this.props.t("Reading Assistant")}
            </div>
            <div
              className={
                this.state.mode === "chat"
                  ? "trans-service-selector"
                  : "trans-service-selector-inactive"
              }
              onClick={() => {
                this.setState({ isAddNew: false, mode: "chat" });
              }}
            >
              <span className={`icon-idea trans-icon`}></span>
              {this.props.t("Chat Assistant")}
            </div>
          </div>

          <select
            className="dict-service-selector"
            style={{ margin: 0, color: "#f16464" }}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              if (event.target.value === "add-new") {
                this.setState({ isAddNew: true });
                return;
              }
              this.handleChangeAiService(event.target.value);
            }}
          >
            <option
              value={""}
              key={"select"}
              className="add-dialog-shelf-list-option"
            >
              {this.props.t("Please select")}
            </option>
            {this.props.plugins
              .filter((item) => item.type === "assistant")
              .map((item) => {
                return (
                  <option
                    value={item.key}
                    key={item.key}
                    className="add-dialog-shelf-list-option"
                    selected={this.state.aiService === item.key ? true : false}
                  >
                    {this.props.t(item.displayName)}
                  </option>
                );
              })}
            <option
              value={"add-new"}
              key={"add-new"}
              className="add-dialog-shelf-list-option"
            >
              {this.props.t("Add new plugin")}
            </option>
          </select>
        </div>

        {this.state.isAddNew && (
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
                this.props.handleOpenMenu(false);
                this.props.handleMenuMode("");
                this.props.handleSetting(true);
                this.props.handleSettingMode("ai");
              }}
            >
              <Trans>Add new plugin</Trans>
            </span>
          </div>
        )}
        {!this.state.isAddNew && (
          <>
            <div
              className="dict-text-box"
              style={{
                marginTop: "60px",
                width: "calc(100% + 20px)",
                height: "calc(100% - 120px)",
                paddingBottom: "0px",
                paddingLeft: "0px",
                paddingRight: "20px",
              }}
              ref={this.chatBoxRef}
            >
              {this.handleRenderHistoryMessage(
                this.state.mode === "ask"
                  ? this.state.askHistory
                  : this.state.chatHistory
              )}
              {this.state.isWaiting ? (
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
                  <span>{this.props.t("Thinking, please wait...")}</span>
                </div>
              ) : (this.state.mode === "ask"
                  ? this.state.askHistory
                  : this.state.chatHistory
                ).length > 0 ? (
                <div className="popup-message-assistant">
                  {Parser(
                    DOMPurify.sanitize(
                      marked.parse(this.state.answer ? this.state.answer : "") +
                        "<address></address>"
                    ) || " ",
                    {
                      replace: (_domNode) => {},
                    }
                  )}
                </div>
              ) : (
                <div className="popup-message-assistant">
                  {this.state.mode === "ask"
                    ? this.props.t(
                        "Hi there! What questions do you have about this chapter?"
                      )
                    : this.props.t(
                        "Hi there! I'm happy to help with any questions about reading or learning"
                      )}
                </div>
              )}
            </div>
            <div
              style={{
                marginLeft: "-25px",
                marginRight: "-25px",
                marginBottom: "-20px",
                padding: "0px 25px",
              }}
            >
              <div className="popup-assist-shortcut-container">
                {sampleQuestion
                  .filter((item) => item.mode === this.state.mode)
                  .map((item) => {
                    return (
                      <div
                        className="popup-assist-shortcut"
                        onClick={() => {
                          this.handleNewQuestion(item.question);
                        }}
                      >
                        {item.emoji + " " + this.props.t(item.question)}
                      </div>
                    );
                  })}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <textarea
                  name="url"
                  placeholder={this.props.t(
                    this.state.mode === "ask"
                      ? "Ask anything about this chapter"
                      : "Ask anything about reading or learning"
                  )}
                  id="trans-add-content-box"
                  className="trans-add-content-box"
                  style={{
                    height: "40px",
                    paddingRight: "40px",
                    resize: "none",

                    marginRight: "10px",
                    marginBottom: "0px",
                  }}
                  onContextMenu={() => {
                    handleContextMenu("trans-add-content-box");
                  }}
                  value={this.state.inputQuestion}
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                    this.setState({
                      inputQuestion: event.target.value,
                    });
                  }}
                />
                <div
                  className="popup-assistant-send-button"
                  onClick={() => {
                    if (this.state.answer || this.state.isWaiting) {
                      return;
                    }
                    this.handleNewQuestion(this.state.inputQuestion);
                    this.setState({
                      inputQuestion: "",
                    });
                  }}
                >
                  {this.props.t("Send")}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
}
export default PopupAssist;
