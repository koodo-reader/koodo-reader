import React from "react";
import { AnnotationDialogProps, AnnotationDialogState } from "./interface";
import "./annotationDialog.css";
import "../../readerSettings/dropdownList/dropdownList.css";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  BRUSH_COLORS,
  BRUSH_WIDTHS,
  HIGHLIGHTER_COLORS,
  HIGHLIGHTER_WIDTHS,
  SHAPE_TYPES,
  TEXT_COLORS,
  TEXT_SIZE_MAX,
  TEXT_SIZE_MIN,
  TEXT_SIZE_STEP,
} from "../../../utils/common";
import FontUtil from "../../../utils/file/fontUtil";

class AnnotationDialog extends React.Component<
  AnnotationDialogProps,
  AnnotationDialogState
> {
  constructor(props: AnnotationDialogProps) {
    super(props);
    this.state = {
      annotationStyle:
        ConfigService.getReaderConfig("annotationStyle") || "brush",
      annotationBrushColor:
        ConfigService.getReaderConfig("annotationBrushColor") ||
        BRUSH_COLORS[0],
      annotationBrushWidth: parseFloat(
        ConfigService.getReaderConfig("annotationBrushWidth") ||
          BRUSH_WIDTHS[1] + ""
      ),
      annotationHighlighterColor:
        ConfigService.getReaderConfig("annotationHighlighterColor") ||
        HIGHLIGHTER_COLORS[0],
      annotationHighlighterWidth: parseFloat(
        ConfigService.getReaderConfig("annotationHighlighterWidth") ||
          HIGHLIGHTER_WIDTHS[1] + ""
      ),
      annotationHighlighterOpacity: parseFloat(
        ConfigService.getReaderConfig("annotationHighlighterOpacity") || "0.4"
      ),
      annotationShapeType:
        ConfigService.getReaderConfig("annotationShapeType") ||
        SHAPE_TYPES[0],
      annotationShapeColor:
        ConfigService.getReaderConfig("annotationShapeColor") ||
        BRUSH_COLORS[0],
      annotationShapeWidth: parseFloat(
        ConfigService.getReaderConfig("annotationShapeWidth") ||
          BRUSH_WIDTHS[1] + ""
      ),
      annotationTextSize: parseFloat(
        ConfigService.getReaderConfig("annotationTextSize") || "24"
      ),
      annotationTextFont:
        ConfigService.getReaderConfig("annotationTextFont") || "sans-serif",
      annotationTextColor:
        ConfigService.getReaderConfig("annotationTextColor") ||
        TEXT_COLORS[0],
      fontOptions: [],
    };
  }
  componentDidMount() {
    this.loadFontOptions();
    window.addEventListener("font-list-changed", this.loadFontOptions);
  }
  componentWillUnmount() {
    window.removeEventListener("font-list-changed", this.loadFontOptions);
  }
  loadFontOptions = async () => {
    const options = (await FontUtil.getMergedFontOptions()).filter(
      (option) => option.value !== "Built-in font"
    );
    this.setState({ fontOptions: options });
  };
  handleSelectTab = (style: string) => {
    this.setState({ annotationStyle: style });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      annotationStyle: style,
    });
    ConfigService.setReaderConfig("annotationStyle", style);
  };
  handleSelectColor = (color: string) => {
    this.setState({ annotationBrushColor: color });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      brushColor: color,
    });
    ConfigService.setReaderConfig("annotationBrushColor", color);
  };
  handleSelectWidth = (width: number) => {
    this.setState({ annotationBrushWidth: width });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      brushWidth: width,
    });
    ConfigService.setReaderConfig("annotationBrushWidth", width + "");
  };
  handleSelectHighlighterColor = (color: string) => {
    this.setState({ annotationHighlighterColor: color });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      highlighterColor: color,
    });
    ConfigService.setReaderConfig("annotationHighlighterColor", color);
  };
  handleSelectHighlighterWidth = (width: number) => {
    this.setState({ annotationHighlighterWidth: width });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      highlighterWidth: width,
    });
    ConfigService.setReaderConfig("annotationHighlighterWidth", width + "");
  };
  handleSelectOpacity = (opacity: number) => {
    this.setState({ annotationHighlighterOpacity: opacity });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      highlighterOpacity: opacity,
    });
  };
  handleOpacityRelease = () => {
    ConfigService.setReaderConfig(
      "annotationHighlighterOpacity",
      this.state.annotationHighlighterOpacity + ""
    );
  };
  handleSelectShapeType = (annotationShapeType: string) => {
    this.setState({ annotationShapeType });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      shapeType: annotationShapeType,
    });
    ConfigService.setReaderConfig("annotationShapeType", annotationShapeType);
  };
  handleSelectShapeColor = (color: string) => {
    this.setState({ annotationShapeColor: color });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      shapeColor: color,
    });
    ConfigService.setReaderConfig("annotationShapeColor", color);
  };
  handleSelectShapeWidth = (width: number) => {
    this.setState({ annotationShapeWidth: width });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      shapeWidth: width,
    });
    ConfigService.setReaderConfig("annotationShapeWidth", width + "");
  };
  handleSelectTextSize = (size: number) => {
    this.setState({ annotationTextSize: size });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      textSize: size,
    });
  };
  handleTextSizeRelease = () => {
    ConfigService.setReaderConfig(
      "annotationTextSize",
      this.state.annotationTextSize + ""
    );
  };
  handleSelectTextFont = (font: string) => {
    this.setState({ annotationTextFont: font });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      textFont: font,
    });
    ConfigService.setReaderConfig("annotationTextFont", font);
  };
  handleSelectTextColor = (color: string) => {
    this.setState({ annotationTextColor: color });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      textColor: color,
    });
    ConfigService.setReaderConfig("annotationTextColor", color);
  };
  renderShapeIcon = (type: string) => {
    const stroke = "currentColor";
    const common = {
      width: 22,
      height: 22,
      viewBox: "0 0 18 18",
      fill: "none",
      stroke,
      strokeWidth: 2,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
    };
    switch (type) {
      case "rect":
        return (
          <svg {...common}>
            <rect x="3" y="4" width="12" height="10" rx="1" />
          </svg>
        );
      case "circle":
        return (
          <svg {...common}>
            <circle cx="9" cy="9" r="6" />
          </svg>
        );
      case "ellipse":
        return (
          <svg {...common} width={24} height={24}>
            <ellipse cx="9" cy="9" rx="6.5" ry="4" />
          </svg>
        );
      case "line":
        return (
          <svg {...common}>
            <line x1="3" y1="14" x2="15" y2="4" />
          </svg>
        );
      case "arrow":
        return (
          <svg {...common}>
            <line x1="3" y1="14" x2="13.5" y2="4.5" />
            <polyline points="8 4.5 13.5 4.5 13.5 10" />
          </svg>
        );
      default:
        return null;
    }
  };
  handleClose = () => {
    this.props.handleAnnotationDialog(false);
    this.props.htmlBook.rendition.applyAnnotationConfig({
      isDrawing: "no",
    });
  };
  render() {
    const {
      annotationStyle,
      annotationBrushColor,
      annotationBrushWidth,
      annotationHighlighterColor,
      annotationHighlighterWidth,
      annotationHighlighterOpacity,
      annotationShapeType,
      annotationShapeColor,
      annotationShapeWidth,
      annotationTextSize,
      annotationTextFont,
      annotationTextColor,
    } = this.state;
    return (
      <div
        className="sort-dialog-container annotation-dialog-container"
        style={{
          left: "auto",
          top: "auto",
          bottom: "60px",
          width: "210px",
          height: "320px",
          overflowY: "scroll",
          right: this.props.isSettingLocked ? 370 : 65,
        }}
      >
        <div className="annotation-dialog-header">
          <span className="annotation-dialog-title">
            {this.props.t("Annotation")}
          </span>
          <span
            className="icon-close annotation-dialog-close"
            onClick={this.handleClose}
          ></span>
        </div>

        <div className="annotation-dialog-tabs">
          <span
            className={
              annotationStyle === "brush"
                ? "annotation-dialog-tab active-annotation-dialog-tab"
                : "annotation-dialog-tab"
            }
            onClick={() => this.handleSelectTab("brush")}
            title={this.props.t("Brush")}
          >
            <span className="icon-edit annotation-dialog-tab-icon"></span>
          </span>
          <span
            className={
              annotationStyle === "highlighter"
                ? "annotation-dialog-tab active-annotation-dialog-tab"
                : "annotation-dialog-tab"
            }
            onClick={() => this.handleSelectTab("highlighter")}
            title={this.props.t("Highlighter")}
          >
            <span className="icon-highlight annotation-dialog-tab-icon"></span>
          </span>
          <span
            className={
              annotationStyle === "shape"
                ? "annotation-dialog-tab active-annotation-dialog-tab"
                : "annotation-dialog-tab"
            }
            onClick={() => this.handleSelectTab("shape")}
            title={this.props.t("Shape")}
          >
            <span className="annotation-dialog-tab-shape">
              <svg
                width="16"
                height="16"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="12" height="10" rx="1" />
              </svg>
            </span>
          </span>
          <span
            className={
              annotationStyle === "text"
                ? "annotation-dialog-tab active-annotation-dialog-tab"
                : "annotation-dialog-tab"
            }
            onClick={() => this.handleSelectTab("text")}
            title={this.props.t("Text")}
          >
            <span className="icon-font annotation-dialog-tab-icon"></span>
          </span>
        </div>

        {annotationStyle === "brush" ? (
          <>
            <div className="annotation-dialog-section">
              <div className="annotation-dialog-label">
                {this.props.t("Brush color")}
              </div>
              <ul className="annotation-color-list">
                {BRUSH_COLORS.map((color) => (
                  <li
                    key={color}
                    className={
                      annotationBrushColor === color
                        ? "annotation-color-item active-annotation-color-item"
                        : "annotation-color-item"
                    }
                    style={{ backgroundColor: color }}
                    onClick={() => this.handleSelectColor(color)}
                  ></li>
                ))}
              </ul>
            </div>

            <div className="annotation-dialog-section">
              <div className="annotation-dialog-label">
                {this.props.t("Brush width")}
              </div>
              <ul className="annotation-width-list">
                {BRUSH_WIDTHS.map((width) => (
                  <li
                    key={width}
                    className={
                      annotationBrushWidth === width
                        ? "annotation-width-item active-annotation-width-item"
                        : "annotation-width-item"
                    }
                    onClick={() => this.handleSelectWidth(width)}
                  >
                    <span
                      className="annotation-width-preview"
                      style={{
                        backgroundColor: annotationBrushColor,
                        height: width + "px",
                        borderRadius: width / 2 + "px",
                      }}
                    ></span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : annotationStyle === "highlighter" ? (
          <>
            <div className="annotation-dialog-section">
              <div className="annotation-dialog-label">
                {this.props.t("Highlighter color")}
              </div>
              <ul className="annotation-color-list">
                {HIGHLIGHTER_COLORS.map((color) => (
                  <li
                    key={color}
                    className={
                      annotationHighlighterColor === color
                        ? "annotation-color-item active-annotation-color-item"
                        : "annotation-color-item"
                    }
                    onClick={() => this.handleSelectHighlighterColor(color)}
                  >
                    <span
                      className="annotation-color-fill"
                      style={{
                        backgroundColor: color,
                        opacity: annotationHighlighterOpacity,
                      }}
                    ></span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="annotation-dialog-section">
              <div className="annotation-dialog-label">
                {this.props.t("Highlighter width")}
              </div>
              <ul className="annotation-width-list">
                {HIGHLIGHTER_WIDTHS.map((width) => (
                  <li
                    key={width}
                    className={
                      annotationHighlighterWidth === width
                        ? "annotation-width-item active-annotation-width-item"
                        : "annotation-width-item"
                    }
                    onClick={() => this.handleSelectHighlighterWidth(width)}
                  >
                    <span
                      className="annotation-width-preview"
                      style={{
                        backgroundColor: annotationHighlighterColor,
                        opacity: annotationHighlighterOpacity,
                        height: width + "px",
                        borderRadius: width / 2 + "px",
                      }}
                    ></span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="annotation-dialog-section annotation-opacity-section">
              <div className="annotation-opacity-label">
                <span>{this.props.t("Opacity")}</span>
                <span className="annotation-opacity-value">
                  {Math.round(annotationHighlighterOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={annotationHighlighterOpacity}
                className="annotation-opacity-slider"
                onChange={(e) =>
                  this.handleSelectOpacity(parseFloat(e.target.value))
                }
                onPointerUp={this.handleOpacityRelease}
                onMouseUp={this.handleOpacityRelease}
                style={{ width: "100%" }}
              />
            </div>
          </>
        ) : annotationStyle === "shape" ? (
          <>
            <div className="annotation-dialog-section">
              <div className="annotation-dialog-label">
                {this.props.t("Shape type")}
              </div>
              <ul className="annotation-shape-list">
                {SHAPE_TYPES.map((type) => (
                  <li
                    key={type}
                    className={
                      annotationShapeType === type
                        ? "annotation-shape-item active-annotation-shape-item"
                        : "annotation-shape-item"
                    }
                    onClick={() => this.handleSelectShapeType(type)}
                    title={this.props.t(
                      type.charAt(0).toUpperCase() + type.slice(1)
                    )}
                  >
                    {this.renderShapeIcon(type)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="annotation-dialog-section">
              <div className="annotation-dialog-label">
                {this.props.t("Shape color")}
              </div>
              <ul className="annotation-color-list">
                {BRUSH_COLORS.map((color) => (
                  <li
                    key={color}
                    className={
                      annotationShapeColor === color
                        ? "annotation-color-item active-annotation-color-item"
                        : "annotation-color-item"
                    }
                    style={{ backgroundColor: color }}
                    onClick={() => this.handleSelectShapeColor(color)}
                  ></li>
                ))}
              </ul>
            </div>

            <div className="annotation-dialog-section">
              <div className="annotation-dialog-label">
                {this.props.t("Shape width")}
              </div>
              <ul className="annotation-width-list">
                {BRUSH_WIDTHS.map((width) => (
                  <li
                    key={width}
                    className={
                      annotationShapeWidth === width
                        ? "annotation-width-item active-annotation-width-item"
                        : "annotation-width-item"
                    }
                    onClick={() => this.handleSelectShapeWidth(width)}
                  >
                    <span
                      className="annotation-width-preview"
                      style={{
                        backgroundColor: annotationShapeColor,
                        height: width + "px",
                        borderRadius: width / 2 + "px",
                      }}
                    ></span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="annotation-dialog-section annotation-text-size-section">
              <div className="annotation-opacity-label">
                <span>{this.props.t("Text size")}</span>
                <span className="annotation-opacity-value">
                  {annotationTextSize}
                </span>
              </div>
              <input
                type="range"
                min={TEXT_SIZE_MIN}
                max={TEXT_SIZE_MAX}
                step={TEXT_SIZE_STEP}
                value={annotationTextSize}
                className="annotation-opacity-slider"
                onChange={(e) =>
                  this.handleSelectTextSize(parseFloat(e.target.value))
                }
                onPointerUp={this.handleTextSizeRelease}
                onMouseUp={this.handleTextSizeRelease}
                style={{ width: "100%" }}
              />
            </div>

            <div className="annotation-dialog-section">
              <div className="annotation-dialog-label">
                {this.props.t("Text font")}
              </div>
              <select
                className="general-setting-dropdown annotation-text-font-select"
                value={annotationTextFont}
                onChange={(e) => this.handleSelectTextFont(e.target.value)}
              >
                {this.state.fontOptions.map((font) => (
                  <option
                    key={font.value}
                    value={font.value}
                    className="general-setting-option"
                  >
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="annotation-dialog-section">
              <div className="annotation-dialog-label">
                {this.props.t("Text color")}
              </div>
              <ul className="annotation-color-list">
                {TEXT_COLORS.map((color) => (
                  <li
                    key={color}
                    className={
                      annotationTextColor === color
                        ? "annotation-color-item active-annotation-color-item"
                        : "annotation-color-item"
                    }
                    style={{ backgroundColor: color }}
                    onClick={() => this.handleSelectTextColor(color)}
                  ></li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    );
  }
}

export default AnnotationDialog;
