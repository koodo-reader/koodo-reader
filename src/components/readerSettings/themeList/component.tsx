import React from "react";
import { backgroundList, textList } from "../../../constants/themeList";
import StyleUtil from "../../../utils/readUtils/styleUtil";
import "./themeList.css";
import { Trans } from "react-i18next";
import { ThemeListProps, ThemeListState } from "./interface";
import StorageUtil from "../../../utils/storageUtil";
import { Panel as ColorPickerPanel } from "rc-color-picker";
import "rc-color-picker/assets/index.css";
import ThemeUtil from "../../../utils/readUtils/themeUtil";
import { Tooltip } from "react-tippy";

class ThemeList extends React.Component<ThemeListProps, ThemeListState> {
  constructor(props: ThemeListProps) {
    super(props);
    this.state = {
      currentBackgroundIndex: backgroundList
        .concat(ThemeUtil.getAllThemes())
        .findIndex((item) => {
          return (
            item ===
            (StorageUtil.getReaderConfig("backgroundColor") ||
              "rgba(255,255,255,1)")
          );
        }),
      currentTextIndex: textList
        .concat(ThemeUtil.getAllThemes())
        .findIndex((item) => {
          return (
            item ===
            (StorageUtil.getReaderConfig("textColor") || "rgba(0,0,0,1)")
          );
        }),
      isShowTextPicker: false,
      isShowBgPicker: false,
    };
  }
  handleChangeBgColor = (color: string, index: number = -1) => {
    StorageUtil.setReaderConfig("backgroundColor", color);
    this.setState({
      currentBackgroundIndex: index,
    });
    if (index === 1) {
      this.props.currentEpub.rendition &&
        this.props.currentEpub.rendition.themes.default({
          "a, article, cite, code, div, li, p, pre, span, table": {
            color: `white !important`,
          },
        });
      StorageUtil.setReaderConfig("textColor", "rgba(255,255,255,1)");
    } else if (
      index === 0 &&
      StorageUtil.getReaderConfig("backgroundColor") === "rgba(255,255,255,1)"
    ) {
      this.props.currentEpub.rendition &&
        this.props.currentEpub.rendition.themes.default({
          "a, article, cite, code, div, li, p, pre, span, table": {
            color: `black !important`,
          },
        });
      StorageUtil.setReaderConfig("textColor", "rgba(0,0,0,1)");
    } else {
      this.props.currentEpub.rendition &&
        this.props.currentEpub.rendition.themes.default({
          "a, article, cite, code, div, li, p, pre, span, table": {
            color: `inherit !important`,
          },
        });
    }
    if (!this.props.currentEpub.rendition) {
      this.handleRest();
    } else {
      StyleUtil.addDefaultCss();
    }
  };
  handleRest = () => {
    this.props.renderFunc("html-render");
  };
  handleChooseBgColor = (color) => {
    StorageUtil.setReaderConfig("backgroundColor", color.color);
    StyleUtil.addDefaultCss();
  };
  handleColorTextPicker = (isShowTextPicker: boolean) => {
    if (
      !isShowTextPicker &&
      textList.concat(ThemeUtil.getAllThemes()).findIndex((item) => {
        return (
          item === (StorageUtil.getReaderConfig("textColor") || "rgba(0,0,0,1)")
        );
      }) === -1
    ) {
      ThemeUtil.setThemes(StorageUtil.getReaderConfig("textColor"));
    }
    this.setState({ isShowTextPicker });
  };
  handleColorBgPicker = (isShowBgPicker: boolean) => {
    if (
      !isShowBgPicker &&
      backgroundList.concat(ThemeUtil.getAllThemes()).findIndex((item) => {
        return (
          item ===
          (StorageUtil.getReaderConfig("backgroundColor") ||
            "rgba(255,255,255,1)")
        );
      }) === -1
    ) {
      ThemeUtil.setThemes(StorageUtil.getReaderConfig("backgroundColor"));
    }
    this.setState({ isShowBgPicker });
  };
  handleChooseTextColor = (color) => {
    if (typeof color !== "object") {
      this.setState({
        currentTextIndex: textList
          .concat(ThemeUtil.getAllThemes())
          .indexOf(color),
      });
    }
    StorageUtil.setReaderConfig(
      "textColor",
      typeof color === "object" ? color.color : color
    );
    this.props.currentEpub.rendition &&
      this.props.currentEpub.rendition.themes.default({
        "a, article, cite, code, div, li, p, pre, span, table": {
          color: `${
            typeof color === "object" ? color.color : color
          } !important`,
        },
      });
    this.handleRest();
  };
  render() {
    const renderBackgroundColorList = () => {
      return backgroundList
        .concat(ThemeUtil.getAllThemes())
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
                  className="icon-close"
                  onClick={() => {
                    ThemeUtil.clear(item);
                  }}
                ></span>
              )}
            </li>
          );
        });
    };
    const renderTextColorList = () => {
      return textList.concat(ThemeUtil.getAllThemes()).map((item, index) => {
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
                className="icon-close"
                onClick={() => {
                  ThemeUtil.clear(item);
                }}
              ></span>
            )}
          </li>
        );
      });
    };
    return (
      <div className="background-color-setting">
        <div className="background-color-text">
          <Trans>Background Color</Trans>
        </div>
        <ul className="background-color-list">
          <Tooltip
            title={this.props.t("Customize")}
            position="top"
            trigger="mouseenter"
            style={{ display: "inline-block" }}
          >
            <li
              className="background-color-circle"
              onClick={() => {
                this.handleColorBgPicker(!this.state.isShowBgPicker);
              }}
            >
              <span
                className={
                  this.state.isShowBgPicker ? "icon-check" : "icon-more"
                }
              ></span>
            </li>
          </Tooltip>

          {renderBackgroundColorList()}
        </ul>
        {this.state.isShowBgPicker && (
          <ColorPickerPanel
            enableAlpha={false}
            color={StorageUtil.getReaderConfig("backgroundColor")}
            onChange={this.handleChooseBgColor}
            mode="RGB"
            style={{
              margin: 20,
              animation: "fade-in 0.2s ease-in-out 0s 1",
            }}
          />
        )}
        <div className="background-color-text">
          <Trans>Text Color</Trans>
        </div>
        <ul className="background-color-list">
          <Tooltip
            title={this.props.t("Customize")}
            position="top"
            trigger="mouseenter"
            style={{ display: "inline-block" }}
          >
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
          </Tooltip>

          {renderTextColorList()}
        </ul>
        {this.state.isShowTextPicker && (
          <ColorPickerPanel
            enableAlpha={false}
            color={StorageUtil.getReaderConfig("textColor")}
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
