import React from "react";
import "./colorOption.css";
import { ColorProps } from "./interface";
import {
  ConfigService,
  HighlightUtil,
  KookitConfig,
} from "../../assets/lib/kookit-extra-browser.min";

class ColorOption extends React.Component<ColorProps> {
  highlightUtil: any;
  constructor(props: ColorProps) {
    super(props);
    this.highlightUtil = new HighlightUtil(ConfigService);
  }
  handleStyleType = (styleType: string) => {
    const color = KookitConfig.HighlightPresetColors[styleType][0];
    const value = { styleType, color };
    this.props.handleHighlight(value);
    this.highlightUtil.saveNoteHighlightValue(value);
  };

  handlePresetColor = (index: number) => {
    const styleType = this.props.highlight.styleType;
    const color = KookitConfig.HighlightPresetColors[styleType][index];
    const value = { styleType, color };
    this.props.handleHighlight(value);
    this.highlightUtil.saveNoteHighlightValue(value);
    if (!this.props.isEdit) {
      setTimeout(() => {
        this.props.handleDigest();
      }, 100);
    }
  };

  render() {
    console.log("this.props.highlight", this.props.highlight);
    const { styleType, color } = this.props.highlight;
    const presetColors = KookitConfig.HighlightPresetColors[styleType];

    return (
      <div
        className={
          this.props.isEdit
            ? "color-option-container color-option-container-edit"
            : "color-option-container"
        }
      >
        <ul className="note-highlight-style-tabs">
          {KookitConfig.HighlightStyleTypes.map((item) => {
            const previewColor =
              item.value === styleType
                ? color
                : KookitConfig.HighlightPresetColors[item.value][0];
            return (
              <li
                key={item.value}
                className={
                  styleType === item.value
                    ? "note-highlight-style-tab active-note-highlight-tab"
                    : "note-highlight-style-tab"
                }
                onClick={() => this.handleStyleType(item.value)}
                style={
                  styleType === item.value
                    ? { borderColor: "currentColor" }
                    : {}
                }
              >
                <span
                  className="note-highlight-style-preview"
                  style={this.highlightUtil.buildHighlightPreviewStyle(
                    item.value,
                    previewColor
                  )}
                >
                  Aa
                </span>
              </li>
            );
          })}
        </ul>
        <ul className="note-highlight-color-container">
          {presetColors.map((presetColor, index) => (
            <li
              key={presetColor}
              className={
                presetColors.indexOf(color) === index
                  ? "note-highlight-color-item active-note-highlight-color"
                  : "note-highlight-color-item"
              }
              style={{ backgroundColor: presetColor }}
              onClick={() => this.handlePresetColor(index)}
            />
          ))}
        </ul>
      </div>
    );
  }
}

export default ColorOption;
