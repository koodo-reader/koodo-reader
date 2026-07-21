import React from "react";
import { AnnotationDialogProps, AnnotationDialogState } from "./interface";
import "./annotationDialog.css";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  BRUSH_COLORS,
  BRUSH_WIDTHS,
  HIGHLIGHTER_COLORS,
  HIGHLIGHTER_WIDTHS,
  SHAPE_TYPES,
} from "../../../utils/common";

class AnnotationDialog extends React.Component<
  AnnotationDialogProps,
  AnnotationDialogState
> {
  constructor(props: AnnotationDialogProps) {
    super(props);
    this.state = {
      annotationStyle:
        ConfigService.getReaderConfig("annotationStyle") || "brush",
      brushColor:
        ConfigService.getReaderConfig("brushColor") || BRUSH_COLORS[0],
      brushWidth: parseFloat(
        ConfigService.getReaderConfig("brushWidth") || BRUSH_WIDTHS[1] + ""
      ),
      highlighterColor:
        ConfigService.getReaderConfig("highlighterColor") ||
        HIGHLIGHTER_COLORS[0],
      highlighterWidth: parseFloat(
        ConfigService.getReaderConfig("highlighterWidth") ||
          HIGHLIGHTER_WIDTHS[1] + ""
      ),
      highlighterOpacity: parseFloat(
        ConfigService.getReaderConfig("highlighterOpacity") || "0.4"
      ),
      shapeType:
        ConfigService.getReaderConfig("shapeType") || SHAPE_TYPES[0],
      shapeColor:
        ConfigService.getReaderConfig("shapeColor") || BRUSH_COLORS[0],
      shapeWidth: parseFloat(
        ConfigService.getReaderConfig("shapeWidth") ||
          BRUSH_WIDTHS[1] + ""
      ),
    };
  }
  handleSelectTab = (style: string) => {
    this.setState({ annotationStyle: style });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      annotationStyle: style,
    });
    ConfigService.setReaderConfig("annotationStyle", style);
  };
  handleSelectColor = (color: string) => {
    this.setState({ brushColor: color });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      brushColor: color,
    });
    ConfigService.setReaderConfig("brushColor", color);
  };
  handleSelectWidth = (width: number) => {
    this.setState({ brushWidth: width });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      brushWidth: width,
    });
    ConfigService.setReaderConfig("brushWidth", width + "");
  };
  handleSelectHighlighterColor = (color: string) => {
    this.setState({ highlighterColor: color });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      highlighterColor: color,
    });
    ConfigService.setReaderConfig("highlighterColor", color);
  };
  handleSelectHighlighterWidth = (width: number) => {
    this.setState({ highlighterWidth: width });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      highlighterWidth: width,
    });
    ConfigService.setReaderConfig("highlighterWidth", width + "");
  };
  handleSelectOpacity = (opacity: number) => {
    this.setState({ highlighterOpacity: opacity });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      highlighterOpacity: opacity,
    });
  };
  handleOpacityRelease = () => {
    ConfigService.setReaderConfig(
      "highlighterOpacity",
      this.state.highlighterOpacity + ""
    );
  };
  handleSelectShapeType = (shapeType: string) => {
    this.setState({ shapeType });
    this.props.htmlBook.rendition.applyAnnotationConfig({ shapeType });
    ConfigService.setReaderConfig("shapeType", shapeType);
  };
  handleSelectShapeColor = (color: string) => {
    this.setState({ shapeColor: color });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      shapeColor: color,
    });
    ConfigService.setReaderConfig("shapeColor", color);
  };
  handleSelectShapeWidth = (width: number) => {
    this.setState({ shapeWidth: width });
    this.props.htmlBook.rendition.applyAnnotationConfig({
      shapeWidth: width,
    });
    ConfigService.setReaderConfig("shapeWidth", width + "");
  };
  renderShapeIcon = (type: string) => {
    const stroke = "currentColor";
    const common = {
      width: 18,
      height: 18,
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
          <svg {...common}>
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
      brushColor,
      brushWidth,
      highlighterColor,
      highlighterWidth,
      highlighterOpacity,
      shapeType,
      shapeColor,
      shapeWidth,
    } = this.state;
    return (
      <div
        className="sort-dialog-container annotation-dialog-container"
        style={{
          left: "auto",
          top: "auto",
          bottom: "60px",
          width: "220px",
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
                      brushColor === color
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
                      brushWidth === width
                        ? "annotation-width-item active-annotation-width-item"
                        : "annotation-width-item"
                    }
                    onClick={() => this.handleSelectWidth(width)}
                  >
                    <span
                      className="annotation-width-preview"
                      style={{
                        backgroundColor: brushColor,
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
                      highlighterColor === color
                        ? "annotation-color-item active-annotation-color-item"
                        : "annotation-color-item"
                    }
                    onClick={() => this.handleSelectHighlighterColor(color)}
                  >
                    <span
                      className="annotation-color-fill"
                      style={{
                        backgroundColor: color,
                        opacity: highlighterOpacity,
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
                      highlighterWidth === width
                        ? "annotation-width-item active-annotation-width-item"
                        : "annotation-width-item"
                    }
                    onClick={() => this.handleSelectHighlighterWidth(width)}
                  >
                    <span
                      className="annotation-width-preview"
                      style={{
                        backgroundColor: highlighterColor,
                        opacity: highlighterOpacity,
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
                  {Math.round(highlighterOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={highlighterOpacity}
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
        ) : (
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
                      shapeType === type
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
                      shapeColor === color
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
                      shapeWidth === width
                        ? "annotation-width-item active-annotation-width-item"
                        : "annotation-width-item"
                    }
                    onClick={() => this.handleSelectShapeWidth(width)}
                  >
                    <span
                      className="annotation-width-preview"
                      style={{
                        backgroundColor: shapeColor,
                        height: width + "px",
                        borderRadius: width / 2 + "px",
                      }}
                    ></span>
                  </li>
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
