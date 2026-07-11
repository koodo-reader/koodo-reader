import React from "react";
import { AnnotationDialogProps, AnnotationDialogState } from "./interface";
import "./annotationDialog.css";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { BRUSH_COLORS, BRUSH_WIDTHS } from "../../../utils/common";

class AnnotationDialog extends React.Component<
  AnnotationDialogProps,
  AnnotationDialogState
> {
  constructor(props: AnnotationDialogProps) {
    super(props);
    this.state = {
      brushColor:
        ConfigService.getReaderConfig("brushColor") || BRUSH_COLORS[0],
      brushWidth: parseFloat(
        ConfigService.getReaderConfig("brushWidth") || BRUSH_WIDTHS[1] + ""
      ),
    };
  }
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
  handleClose = () => {
    this.props.handleAnnotationDialog(false);
    this.props.htmlBook.rendition.applyAnnotationConfig({
      isDrawing: "no",
    });
  };
  render() {
    const { brushColor, brushWidth } = this.state;
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
      </div>
    );
  }
}

export default AnnotationDialog;
