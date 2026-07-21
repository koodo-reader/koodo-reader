import React from "react";
import { AnnotationDialogProps, AnnotationDialogState } from "./interface";
import "./annotationDialog.css";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  BRUSH_COLORS,
  BRUSH_WIDTHS,
  HIGHLIGHTER_COLORS,
  HIGHLIGHTER_WIDTHS,
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
    } = this.state;
    return (
      <div
        className="sort-dialog-container annotation-dialog-container"
        style={{
          left: "auto",
          top: "auto",
          bottom: "60px",
          width: "200px",
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
        ) : (
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
              />
            </div>
          </>
        )}
      </div>
    );
  }
}

export default AnnotationDialog;
