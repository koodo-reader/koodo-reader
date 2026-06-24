import React from "react";
import "./colorOption.css";
import { ColorProps } from "./interface";
import {
  highlightPresetColors,
  highlightStyleTypes,
} from "../../constants/highlightList";
import {
  buildHighlightPreviewStyle,
  saveNoteHighlightValue,
} from "../../utils/reader/highlightUtil";

class ColorOption extends React.Component<ColorProps> {
  handleStyleType = (styleType: string) => {
    const color = highlightPresetColors[styleType][0];
    const value = { styleType, color };
    this.props.handleHighlight(value);
    saveNoteHighlightValue(value);
  };

  handlePresetColor = (index: number) => {
    const styleType = this.props.highlight.styleType;
    const color = highlightPresetColors[styleType][index];
    const value = { styleType, color };
    this.props.handleHighlight(value);
    saveNoteHighlightValue(value);
    if (!this.props.isEdit) {
      setTimeout(() => {
        this.props.handleDigest();
      }, 100);
    }
  };

  render() {
    let { styleType, color } = this.props.highlight;
    if (this.props.isEdit && this.props.noteItem?.color) {
      [styleType, color] = this.props.noteItem.color.split("-");
    }
    const presetColors = highlightPresetColors[styleType];

    return (
      <div
        className="color-option-container"
        style={
          this.props.isEdit
            ? {
                position: "absolute",
                top: "calc(100% - 110px)",
                width: "70%",
                marginLeft: 0,
              }
            : {}
        }
      >
        <ul className="note-highlight-style-tabs">
          {highlightStyleTypes.map((item) => {
            const previewColor =
              item.value === styleType
                ? color
                : highlightPresetColors[item.value][0];
            return (
              <li
                key={item.value}
                className={
                  styleType === item.value
                    ? "note-highlight-style-tab active-note-highlight-tab"
                    : "note-highlight-style-tab"
                }
                onClick={() => this.handleStyleType(item.value)}
              >
                <span
                  className="note-highlight-style-preview"
                  style={buildHighlightPreviewStyle(item.value, previewColor)}
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
