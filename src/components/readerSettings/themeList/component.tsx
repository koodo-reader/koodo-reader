import React from "react";
import { backgroundList, textList, lines } from "../../../constants/themeList";
import StyleUtil from "../../../utils/readUtils/styleUtil";
import "./themeList.css";
import { Trans } from "react-i18next";
import { ThemeListProps, ThemeListState } from "./interface";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import { Panel as ColorPickerPanel } from "rc-color-picker";
import "rc-color-picker/assets/index.css";
import ThemeUtil from "../../../utils/readUtils/themeUtil";
import BookUtil from "../../../utils/fileUtils/bookUtil";
import { getIframeDoc } from "../../../utils/serviceUtils/docUtil";
import styleUtil from "../../../utils/readUtils/styleUtil";



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
      isButtonClicked: false,

    };
  }
  handleChangeBgColor = (color: string, index: number = -1) => {
    StorageUtil.setReaderConfig("backgroundColor", color);
    this.setState({
      currentBackgroundIndex: index,
    });
    if (index === 1) {
      StorageUtil.setReaderConfig("textColor", "rgba(255,255,255,1)");
    } else if (
      index === 0 &&
      StorageUtil.getReaderConfig("backgroundColor") === "rgba(255,255,255,1)"
    ) {
      StorageUtil.setReaderConfig("textColor", "rgba(0,0,0,1)");
    }
    BookUtil.reloadBooks();
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
  handleChooseTextColor = (color, useAltCss: boolean) => {
    StorageUtil.setReaderConfig("useAltCss", useAltCss.toString());
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
    this.props.renderBookFunc();
  };

  applyDynamicStyles = () => {
    let doc = getIframeDoc();

    if (!doc) {
      console.error("document introuvable");
      return;
    }

    // Injecter les styles globaux dynamiquement
    const styleElement = doc.querySelector("#dynamic-line-colors") || doc.createElement("style");
    styleElement.id = "dynamic-line-colors";

    // Récupérer les styles de getCustomAltCss
    const styles = styleUtil.getCustomAltCss();
    styleElement.textContent = styles;
    doc.head.appendChild(styleElement);

  }
  handleChooseLineColor = (isButtonClicked, colors: string[], useAltCss: boolean) => {

    const colorsJSON = JSON.stringify(colors);

    if (colors.length) {
      StorageUtil.setReaderConfig("lineColors", colorsJSON);
    } else {
      StorageUtil.setReaderConfig("lineColors", '');
    }
    StorageUtil.setReaderConfig("useAltCss", useAltCss.toString());
    if (isButtonClicked) {

      this.applyDynamicStyles();
      this.props.renderBookFunc();
    }
    this.setState({ isButtonClicked: false });
  }



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
              style={{ backgroundColor: item }}>
              {index > 3 && index === this.state.currentBackgroundIndex && (
                <span
                  className="icon-close"
                  onClick={() => {
                    ThemeUtil.clear(item);
                  }}></span>
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
              this.handleChooseTextColor(item, false);
            }}
            style={{ backgroundColor: item }}>
            {index > 3 && index === this.state.currentTextIndex && (
              <span
                className="icon-close"
                onClick={() => {
                  ThemeUtil.clear(item);
                }}></span>
            )}
          </li>
        );
      });
    };

    return (
      <div className="background-color-setting">
        <div className="background-color-text">
          <Trans>Background color</Trans>
        </div>
        <ul className="background-color-list">
          <li
            className="background-color-circle"
            onClick={() => {
              this.handleColorBgPicker(!this.state.isShowBgPicker);
            }}>
            <span
              className={
                this.state.isShowBgPicker ? "icon-check" : "icon-more"
              }></span>
          </li>

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
          <Trans>Text color</Trans>
        </div>
        <ul className="background-color-list">
          <li
            className="background-color-circle"
            onClick={() => {
              this.handleColorTextPicker(!this.state.isShowTextPicker);
            }}>
            <span
              className={
                this.state.isShowTextPicker ? "icon-check" : "icon-more"
              }></span>
          </li>

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

        <div className="background-color-line">
          <Trans>Colorier les lignes</Trans>
        </div>
        <div className="grp-btn-change-color-line">
          <button
            id="<btn-change-color>"
            onClick={() => this.handleChooseLineColor(!this.state.isButtonClicked, lines, true)}
            className="btn-style"
          >
            A+
          </button>

          <button
            onClick={() => this.handleChooseLineColor(!this.state.isButtonClicked, [""], true)}
            className="btn--reset-style"
          >
            A-
          </button>

        </div>

      </div>
    );
  }
}

export default ThemeList;
