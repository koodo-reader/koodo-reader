import React from "react";
import { backgroundList, textList } from "../../../constants/themeList";
import StyleUtil from "../../../utils/reader/styleUtil";
import "./themeList.css";
import { Trans } from "react-i18next";
import { ThemeListProps, ThemeListState } from "./interface";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { Panel as ColorPickerPanel } from "rc-color-picker";
import "rc-color-picker/assets/index.css";
import BookUtil from "../../../utils/file/bookUtil";
import toast from "react-hot-toast";

class ThemeList extends React.Component<ThemeListProps, ThemeListState> {
  constructor(props: ThemeListProps) {
    super(props);
    this.state = {
      currentBackgroundIndex: backgroundList
        .concat(ConfigService.getAllListConfig("themeColors"))
        .findIndex((item) => {
          return (
            item ===
            (ConfigService.getReaderConfig("backgroundColor") ||
              "rgba(255,255,255,1)")
          );
        }),
      currentTextIndex: textList
        .concat(ConfigService.getAllListConfig("themeColors"))
        .findIndex((item) => {
          return (
            item ===
            (ConfigService.getReaderConfig("textColor") || "rgba(0,0,0,1)")
          );
        }),
      isShowTextPicker: false,
      isShowBgPicker: false,
    };
  }
  handleChangeBgColor = (color: string, index: number = -1) => {
    ConfigService.setReaderConfig("backgroundColor", color);
    this.props.handleBackgroundColor(color);
    this.setState({
      currentBackgroundIndex: index,
    });
    if (index === 1) {
      ConfigService.setReaderConfig("textColor", "rgba(255,255,255,1)");
    } else if (
      index === 0 &&
      ConfigService.getReaderConfig("backgroundColor") === "rgba(255,255,255,1)"
    ) {
      ConfigService.setReaderConfig("textColor", "rgba(0,0,0,1)");
    }
    this.props.renderBookFunc();
  };

  handleChooseBgColor = (color) => {
    ConfigService.setReaderConfig("backgroundColor", color.color);
    this.props.handleBackgroundColor(color.color);
    StyleUtil.addDefaultCss();
  };
  handleColorTextPicker = (isShowTextPicker: boolean) => {
    if (
      !isShowTextPicker &&
      textList
        .concat(ConfigService.getAllListConfig("themeColors"))
        .findIndex((item) => {
          return (
            item ===
            (ConfigService.getReaderConfig("textColor") || "rgba(0,0,0,1)")
          );
        }) === -1
    ) {
      ConfigService.setListConfig(
        ConfigService.getReaderConfig("textColor"),
        "themeColors"
      );
    }
    this.setState({ isShowTextPicker });
  };
  handleColorBgPicker = (isShowBgPicker: boolean) => {
    if (
      !isShowBgPicker &&
      backgroundList
        .concat(ConfigService.getAllListConfig("themeColors"))
        .findIndex((item) => {
          return (
            item ===
            (ConfigService.getReaderConfig("backgroundColor") ||
              "rgba(255,255,255,1)")
          );
        }) === -1
    ) {
      ConfigService.setListConfig(
        ConfigService.getReaderConfig("backgroundColor"),
        "themeColors"
      );
    }
    this.setState({ isShowBgPicker });
  };
  handleChooseTextColor = (color) => {
    if (typeof color !== "object") {
      this.setState({
        currentTextIndex: textList
          .concat(ConfigService.getAllListConfig("themeColors"))
          .indexOf(color),
      });
    }
    ConfigService.setReaderConfig(
      "textColor",
      typeof color === "object" ? color.color : color
    );
    this.props.renderBookFunc();
  };
  render() {
    const renderBackgroundColorList = () => {
      return backgroundList
        .concat(ConfigService.getAllListConfig("themeColors"))
        .map((item, index) => {
          return (
            <li
              key={item + index}
              className={
                index === this.state.currentBackgroundIndex
                  ? "active-color background-color-circle"
                  : "background-color-circle"
              }
              onClick={() => {
                this.handleChangeBgColor(item, index);
              }}
              style={{ backgroundColor: item }}
            >
              {index > 3 && index === this.state.currentBackgroundIndex && (
                <span
                  className="icon-close theme-color-delete"
                  onClick={() => {
                    ConfigService.deleteListConfig(item, "themeColors");
                  }}
                ></span>
              )}
            </li>
          );
        });
    };
    const renderTextColorList = () => {
      return textList
        .concat(ConfigService.getAllListConfig("themeColors"))
        .map((item, index) => {
          return (
            <li
              key={item + index}
              className={
                index === this.state.currentTextIndex
                  ? "active-color background-color-circle"
                  : "background-color-circle"
              }
              onClick={() => {
                this.handleChooseTextColor(item);
              }}
              style={{ backgroundColor: item }}
            >
              {index > 3 && index === this.state.currentTextIndex && (
                <span
                  className="icon-close theme-color-delete"
                  onClick={() => {
                    ConfigService.deleteListConfig(item, "themeColors");
                  }}
                ></span>
              )}
            </li>
          );
        });
    };
    return (
      <div className="background-color-setting">
        <div
          className="background-color-text"
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <Trans>Background color</Trans>
          <span
            className="theme-color-clear-button"
            onClick={() => {
              ConfigService.setReaderConfig("backgroundColor", "");
              this.props.handleBackgroundColor("");
              toast.success(this.props.t("Removal successful"));
              this.props.renderBookFunc();
            }}
          >
            <Trans>Clear</Trans>{" "}
            <span className="icon-trash" style={{ fontSize: "13px" }}></span>
          </span>
        </div>
        <ul className="background-color-list">
          <li
            className="background-color-circle"
            onClick={() => {
              this.handleColorBgPicker(!this.state.isShowBgPicker);
            }}
          >
            <span
              className={this.state.isShowBgPicker ? "icon-check" : "icon-more"}
            ></span>
          </li>

          {renderBackgroundColorList()}
        </ul>
        {this.state.isShowBgPicker && (
          <ColorPickerPanel
            enableAlpha={false}
            color={ConfigService.getReaderConfig("backgroundColor")}
            onChange={this.handleChooseBgColor}
            mode="RGB"
            style={{
              margin: 20,
              animation: "fade-in 0.2s ease-in-out 0s 1",
            }}
          />
        )}
        <div
          className="background-color-text"
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <Trans>Text color</Trans>
          <span
            className="theme-color-clear-button"
            onClick={() => {
              ConfigService.setReaderConfig("textColor", "");
              toast.success(this.props.t("Removal successful"));
              this.props.renderBookFunc();
            }}
          >
            <Trans>Clear</Trans>{" "}
            <span className="icon-trash" style={{ fontSize: "13px" }}></span>
          </span>
        </div>
        <ul className="background-color-list">
          <li
            className="background-color-circle"
            onClick={() => {
              this.handleColorTextPicker(!this.state.isShowTextPicker);
            }}
          >
            <span
              className={
                this.state.isShowTextPicker ? "icon-check" : "icon-more"
              }
            ></span>
          </li>

          {renderTextColorList()}
        </ul>
        {this.state.isShowTextPicker && (
          <ColorPickerPanel
            enableAlpha={false}
            color={ConfigService.getReaderConfig("textColor")}
            onChange={this.handleChooseTextColor}
            mode="RGB"
            style={{
              margin: 20,
              animation: "fade-in 0.2s ease-in-out 0s 1",
            }}
          />
        )}
      </div>
    );
  }
}

export default ThemeList;
