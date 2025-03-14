import React from "react";
import "./popupAssist.css";
import { PopupAssistProps, PopupAssistState } from "./interface";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import Parser from "html-react-parser";
import DOMPurify from "dompurify";
import axios from "axios";
import { Trans } from "react-i18next";
import {
  getDefaultTransTarget,
  handleContextMenu,
  openExternalUrl,
  WEBSITE_URL,
} from "../../../utils/common";
import toast from "react-hot-toast";
import DatabaseService from "../../../utils/storage/databaseService";
import { checkPlugin } from "../../../utils/common";
import { getSummaryStream } from "../../../utils/request/reader";
declare var window: any;
class PopupAssist extends React.Component<PopupAssistProps, PopupAssistState> {
  constructor(props: PopupAssistProps) {
    super(props);
    this.state = {
      sumText: this.props.t("Please wait"),
      prototype: "",
      sumService:
        ConfigService.getReaderConfig("sumService") ||
        "official-ai-assistant-plugin",
      sumTarget: ConfigService.getReaderConfig("sumTarget") || "English",
      isAddNew: false,
    };
  }
  componentDidMount() {
    this.handleSum();
  }
  async handleSum() {
    let originalText = this.props.originalText
      .replace(/(\r\n|\n|\r)/gm, "")
      .replace(/-/gm, "");
    console.log(this.props.isAuthed, "this.props.isAuthed");
    if (
      (!this.state.sumService ||
        this.props.plugins.findIndex(
          (item) => item.key === this.state.sumService
        ) === -1) &&
      !this.props.isAuthed
    ) {
      this.setState({ isAddNew: true });
    }
    this.handleSummary(originalText);
  }
  handleSummary = async (text: string) => {
    let sumText = "";
    try {
      if (
        this.state.sumService &&
        this.state.sumService !== "official-ai-assistant-plugin"
      ) {
        let plugin = this.props.plugins.find(
          (item) => item.key === this.state.sumService
        );
        if (!plugin) return;
        let dictFunc = plugin.script;
        // eslint-disable-next-line no-eval
        eval(dictFunc);
        sumText = await window.getsumText(
          text,
          "auto",
          this.state.sumTarget,
          axios,
          this.props.t,
          plugin.config
        );
      } else if (this.props.isAuthed) {
        let plugin = this.props.plugins.find(
          (item) => item.key === "official-ai-assistant-plugin"
        );
        if (!plugin) {
          return;
        }
        let isFirst = true;
        getSummaryStream(
          text,
          ConfigService.getReaderConfig("sumTarget") ||
            getDefaultTransTarget(plugin.langList),
          (result) => {
            console.log(result);
            if (result && result.text) {
              if (isFirst) {
                this.setState({
                  sumText: result.text,
                });
                isFirst = false;
              } else {
                this.setState({
                  sumText: this.state.sumText + result.text,
                });
              }
            }
          }
        );
      }

      if (sumText.startsWith("https://")) {
        openExternalUrl(sumText, true);
      } else {
        this.setState(
          {
            sumText: sumText,
          },
          () => {
            let moreElement = document.querySelector(".dict-learn-more");
            if (moreElement) {
              moreElement.addEventListener("click", () => {
                openExternalUrl(
                  window.learnMoreUrl || "https://www.koodoreader.com"
                );
              });
            }
          }
        );
      }
    } catch (error) {
      console.error(error);
      this.setState({
        sumText: this.props.t("Error happened"),
      });
    }
  };
  handleChangesumService = (sumService: string) => {
    let plugin = this.props.plugins.find((item) => item.key === sumService);
    if (!plugin) {
      return;
    }
    this.setState(
      {
        sumService: sumService,
        isAddNew: false,
      },
      () => {
        ConfigService.setReaderConfig("sumService", sumService);
        if (!plugin) return;
        this.setState(
          {
            sumTarget: getDefaultTransTarget(plugin.langList),
          },
          () => {
            if (!plugin) return;
            ConfigService.setReaderConfig(
              "sumTarget",
              getDefaultTransTarget(plugin.langList)
            );
            this.handleSum();
          }
        );
      }
    );
  };

  render() {
    console.log(this.props.plugins, "this.props.plugins");
    const renderSumBox = () => {
      console.log(
        this.props.plugins.filter((item) => item.type === "assistant")
      );
      console.log(
        this.props.plugins.find((item) => item.key === this.state.sumService)
          ?.langList
      );
      return (
        <div className="dict-container">
          <div className="dict-service-container">
            <select
              className="dict-service-selector"
              style={{ margin: 0 }}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                if (event.target.value === "add-new") {
                  this.setState({ isAddNew: true });
                  return;
                }
                this.handleChangesumService(event.target.value);
              }}
            >
              {this.props.plugins
                .filter((item) => item.type === "assistant")
                .map((item) => {
                  return (
                    <option
                      value={item.key}
                      key={item.key}
                      className="add-dialog-shelf-list-option"
                      selected={
                        this.state.sumService === item.key ? true : false
                      }
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

          <div className="dict-service-container" style={{ right: 150 }}>
            <select
              className="dict-service-selector"
              style={{ margin: 0 }}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                let plugin = this.props.plugins.find(
                  (item) => item.key === this.state.sumService
                );
                console.log(plugin, "plugin435345");
                if (!plugin) {
                  return;
                }
                console.log(plugin.langList, "plugin.langList");
                this.setState(
                  {
                    sumTarget:
                      event.target.value ||
                      getDefaultTransTarget(plugin.langList),
                  },
                  () => {
                    ConfigService.setReaderConfig(
                      "sumTarget",
                      event.target.value
                    );
                    this.handleSum();
                  }
                );
              }}
            >
              {this.props.plugins.find(
                (item) => item.key === this.state.sumService
              )?.langList &&
                Object.keys(
                  this.props.plugins.find(
                    (item) => item.key === this.state.sumService
                  )?.langList as any
                ).map((item, index) => {
                  return (
                    <option
                      value={item}
                      key={index}
                      className="add-dialog-shelf-list-option"
                      selected={
                        ConfigService.getReaderConfig("sumTarget") === item
                          ? true
                          : false
                      }
                    >
                      {
                        Object.values(
                          this.props.plugins.find(
                            (item) => item.key === this.state.sumService
                          )?.langList as any[]
                        )[index]
                      }
                    </option>
                  );
                })}
            </select>
          </div>
          {this.state.isAddNew && (
            <div
              className="trans-add-new-container"
              style={{ fontWeight: 500, marginTop: "60px", height: "170px" }}
            >
              <textarea
                name="url"
                placeholder={this.props.t(
                  "Paste the code of the plugin here, check out document to learn how to get more plugins"
                )}
                id="trans-add-content-box"
                className="trans-add-content-box"
                onContextMenu={() => {
                  handleContextMenu("trans-add-content-box");
                }}
              />
              <div className="trans-add-button-container">
                <div
                  className="trans-add-cancel"
                  style={{ color: "#2084e8" }}
                  onClick={() => {
                    if (
                      ConfigService.getReaderConfig("lang") === "zhCN" ||
                      ConfigService.getReaderConfig("lang") === "zhTW" ||
                      ConfigService.getReaderConfig("lang") === "zhMO"
                    ) {
                      openExternalUrl(WEBSITE_URL + "/zh/plugin");
                    } else {
                      openExternalUrl(WEBSITE_URL + "/en/plugin");
                    }
                  }}
                >
                  <Trans>Document</Trans>
                </div>
                <div
                  className="trans-add-cancel"
                  onClick={() => {
                    this.setState({ isAddNew: false });
                  }}
                >
                  <Trans>Cancel</Trans>
                </div>
                <div
                  className="trans-add-confirm"
                  style={{ backgroundColor: "#2084e8" }}
                  onClick={async () => {
                    let value: string = (
                      document.querySelector(
                        "#trans-add-content-box"
                      ) as HTMLTextAreaElement
                    ).value;
                    if (value) {
                      let plugin: any = JSON.parse(value);
                      plugin.key = plugin.identifier;
                      if (!(await checkPlugin(plugin))) {
                        toast.error(this.props.t("Plugin verification failed"));
                        return;
                      }
                      if (
                        this.props.plugins.find(
                          (item) => item.key === plugin.key
                        )
                      ) {
                        await DatabaseService.updateRecord(plugin, "plugins");
                      } else {
                        await DatabaseService.saveRecord(plugin, "plugins");
                      }
                      this.props.handleFetchPlugins();
                      toast.success(this.props.t("Addition successful"));
                    }
                    this.setState({
                      isAddNew: false,
                      sumText: this.props.t("Please select the service"),
                    });
                  }}
                >
                  <Trans>Confirm</Trans>
                </div>
              </div>
            </div>
          )}
          {!this.state.isAddNew && (
            <div
              className="dict-text-box"
              style={{ marginTop: "60px", height: "230px" }}
            >
              {Parser(
                DOMPurify.sanitize(
                  this.state.sumText + "<address></address>"
                ) || " ",
                {
                  replace: (_domNode) => {},
                }
              )}
            </div>
          )}
        </div>
      );
    };
    return renderSumBox();
  }
}
export default PopupAssist;
