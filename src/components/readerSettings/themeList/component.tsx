import React from "react";
import { backgroundList, lines, textList } from "../../../constants/themeList";
import StyleUtil from "../../../utils/readUtils/styleUtil";
import "./themeList.css";
import { Trans } from "react-i18next";
import { ThemeListProps, ThemeListState } from "./interface";
import StorageUtil from "../../../utils/serviceUtils/storageUtil";
import { Panel as ColorPickerPanel } from "rc-color-picker";
import "rc-color-picker/assets/index.css";
import ThemeUtil from "../../../utils/readUtils/themeUtil";
import BookUtil from "../../../utils/fileUtils/bookUtil";
import Lignescouleurs1 from "../../../assets/Lignescouleurs1.png"
import Lignescouleurs2 from "../../../assets/Lignescouleurs2.png"



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
  handleChooseTextColor = (color, changeColorsTriggered: boolean) => {
    StorageUtil.setReaderConfig("changeColorsTriggered", changeColorsTriggered.toString());
    const event = new Event('localStorageChange');
    window.dispatchEvent(event);
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


  handleChooseLineColor = (isButtonClicked) => {

    if (isButtonClicked) {
      this.props.renderBookFunc();
    }
    this.setState({ isButtonClicked: false });
  }


  handleClick = (changeColorsTriggered: boolean) => {
    StorageUtil.setReaderConfig("changeColorsTriggered", changeColorsTriggered.toString());
    StorageUtil.setReaderConfig("baseColors", JSON.stringify(lines));
    const event = new Event('localStorageChange');
    window.dispatchEvent(event);
    this.props.renderBookWithLineColors();
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
            id="btn-change-color"
            onClick={() => this.handleClick(true)}
            className="btn-style"
          >

            <img src={Lignescouleurs1} alt="ligneCouleur" />
          </button>

          <button
            onClick={() => this.handleChooseLineColor(!this.state.isButtonClicked)}
            className="btn--reset-style"
          >
            <img src={Lignescouleurs2} alt="ligneCouleur" />
          </button>

        </div>

      </div>
    );
  }
}

export default ThemeList;
