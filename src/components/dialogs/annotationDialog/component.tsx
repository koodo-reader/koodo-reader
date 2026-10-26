import { useLatest } from "../../../utils/hooks/useLatest";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAppStore } from "../../../store/useAppStore";
import "./annotationDialog.css";
import "../../readerSettings/dropdownList/dropdownList.css";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import {
  BRUSH_COLORS,
  BRUSH_WIDTHS,
  ERASER_WIDTH_DEFAULT,
  ERASER_WIDTH_MAX,
  ERASER_WIDTH_MIN,
  ERASER_WIDTH_STEP,
  HIGHLIGHTER_COLORS,
  HIGHLIGHTER_WIDTHS,
  SHAPE_TYPES,
  TEXT_COLORS,
  TEXT_SIZE_MAX,
  TEXT_SIZE_MIN,
  TEXT_SIZE_STEP,
} from "../../../utils/common";
import FontUtil from "../../../utils/file/fontUtil";

export interface AnnotationDialogState {
  annotationStyle: string;
  annotationBrushColor: string;
  annotationBrushWidth: number;
  annotationHighlighterColor: string;
  annotationHighlighterWidth: number;
  annotationHighlighterOpacity: number;
  annotationShapeType: string;
  annotationShapeColor: string;
  annotationShapeWidth: number;
  annotationEraserWidth: number;
  annotationQuickErase: string;
  annotationTextSize: number;
  annotationTextFont: string;
  annotationTextColor: string;
  fontOptions: { label: string; value: string }[];
}

const AnnotationDialog = () => {
  const htmlBook = useAppStore((s) => s.reader.htmlBook);
  const handleAnnotationDialog = useAppStore((s) => s.handleAnnotationDialog);
  const { t } = useTranslation();
  const [state, setState] = useState<AnnotationDialogState>(() => ({
    annotationStyle:
      ConfigService.getReaderConfig("annotationStyle") || "brush",
    annotationBrushColor:
      ConfigService.getReaderConfig("annotationBrushColor") || BRUSH_COLORS[0],
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
      ConfigService.getReaderConfig("annotationShapeType") || SHAPE_TYPES[0],
    annotationShapeColor:
      ConfigService.getReaderConfig("annotationShapeColor") || BRUSH_COLORS[0],
    annotationShapeWidth: parseFloat(
      ConfigService.getReaderConfig("annotationShapeWidth") ||
        BRUSH_WIDTHS[1] + ""
    ),
    annotationEraserWidth: parseFloat(
      ConfigService.getReaderConfig("annotationEraserWidth") ||
        ERASER_WIDTH_DEFAULT + ""
    ),
    annotationQuickErase:
      ConfigService.getReaderConfig("annotationQuickErase") || "no",
    annotationTextSize: parseFloat(
      ConfigService.getReaderConfig("annotationTextSize") || "24"
    ),
    annotationTextFont:
      ConfigService.getReaderConfig("annotationTextFont") || "sans-serif",
    annotationTextColor:
      ConfigService.getReaderConfig("annotationTextColor") || TEXT_COLORS[0],
    fontOptions: [],
  }));
  const stateRef = useLatest(state);

  const updateState = (patch: Partial<AnnotationDialogState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setState((prev) => ({ ...prev, ...patch }));
  };

  const loadFontOptions = async () => {
    const options = (await FontUtil.getMergedFontOptions()).filter(
      (option) => option.value !== "Built-in font"
    );
    updateState({ fontOptions: options });
  };
  const loadFontOptionsRef = useLatest(loadFontOptions);

  useEffect(() => {
    loadFontOptionsRef.current();
    const handler = () => loadFontOptionsRef.current();
    window.addEventListener("font-list-changed", handler);
    return () => {
      window.removeEventListener("font-list-changed", handler);
    };
  }, []);

  const handleSelectTab = (style: string) => {
    updateState({ annotationStyle: style });
    htmlBook.rendition.applyAnnotationConfig({
      annotationStyle: style,
    });
    ConfigService.setReaderConfig("annotationStyle", style);
  };
  const handleSelectColor = (color: string) => {
    updateState({ annotationBrushColor: color });
    htmlBook.rendition.applyAnnotationConfig({
      brushColor: color,
    });
    ConfigService.setReaderConfig("annotationBrushColor", color);
  };
  const handleSelectWidth = (width: number) => {
    updateState({ annotationBrushWidth: width });
    htmlBook.rendition.applyAnnotationConfig({
      brushWidth: width,
    });
    ConfigService.setReaderConfig("annotationBrushWidth", width + "");
  };
  const handleSelectHighlighterColor = (color: string) => {
    updateState({ annotationHighlighterColor: color });
    htmlBook.rendition.applyAnnotationConfig({
      highlighterColor: color,
    });
    ConfigService.setReaderConfig("annotationHighlighterColor", color);
  };
  const handleSelectHighlighterWidth = (width: number) => {
    updateState({ annotationHighlighterWidth: width });
    htmlBook.rendition.applyAnnotationConfig({
      highlighterWidth: width,
    });
    ConfigService.setReaderConfig("annotationHighlighterWidth", width + "");
  };
  const handleSelectOpacity = (opacity: number) => {
    updateState({ annotationHighlighterOpacity: opacity });
    htmlBook.rendition.applyAnnotationConfig({
      highlighterOpacity: opacity,
    });
  };
  const handleOpacityRelease = () => {
    ConfigService.setReaderConfig(
      "annotationHighlighterOpacity",
      stateRef.current.annotationHighlighterOpacity + ""
    );
  };
  const handleSelectShapeType = (annotationShapeType: string) => {
    updateState({ annotationShapeType });
    htmlBook.rendition.applyAnnotationConfig({
      shapeType: annotationShapeType,
    });
    ConfigService.setReaderConfig("annotationShapeType", annotationShapeType);
  };
  const handleSelectShapeColor = (color: string) => {
    updateState({ annotationShapeColor: color });
    htmlBook.rendition.applyAnnotationConfig({
      shapeColor: color,
    });
    ConfigService.setReaderConfig("annotationShapeColor", color);
  };
  const handleSelectShapeWidth = (width: number) => {
    updateState({ annotationShapeWidth: width });
    htmlBook.rendition.applyAnnotationConfig({
      shapeWidth: width,
    });
    ConfigService.setReaderConfig("annotationShapeWidth", width + "");
  };
  const handleSelectEraserWidth = (width: number) => {
    updateState({ annotationEraserWidth: width });
    htmlBook.rendition.applyAnnotationConfig({
      eraserWidth: width,
    });
    ConfigService.setReaderConfig("annotationEraserWidth", width + "");
  };
  const handleEraserWidthRelease = () => {
    ConfigService.setReaderConfig(
      "annotationEraserWidth",
      stateRef.current.annotationEraserWidth + ""
    );
  };
  const handleToggleQuickErase = () => {
    const next =
      stateRef.current.annotationQuickErase === "yes" ? "no" : "yes";
    updateState({ annotationQuickErase: next });
    htmlBook.rendition.applyAnnotationConfig({
      quickErase: next,
    });
    ConfigService.setReaderConfig("annotationQuickErase", next);
  };
  const handleSelectTextSize = (size: number) => {
    updateState({ annotationTextSize: size });
    htmlBook.rendition.applyAnnotationConfig({
      textSize: size,
    });
  };
  const handleTextSizeRelease = () => {
    ConfigService.setReaderConfig(
      "annotationTextSize",
      stateRef.current.annotationTextSize + ""
    );
  };
  const handleSelectTextFont = (font: string) => {
    updateState({ annotationTextFont: font });
    htmlBook.rendition.applyAnnotationConfig({
      textFont: font,
    });
    ConfigService.setReaderConfig("annotationTextFont", font);
  };
  const handleSelectTextColor = (color: string) => {
    updateState({ annotationTextColor: color });
    htmlBook.rendition.applyAnnotationConfig({
      textColor: color,
    });
    ConfigService.setReaderConfig("annotationTextColor", color);
  };
  const renderShapeIcon = (type: string) => {
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
  const handleClose = () => {
    handleAnnotationDialog(false);
  };

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
    annotationEraserWidth,
    annotationQuickErase,
    annotationTextSize,
    annotationTextFont,
    annotationTextColor,
  } = state;
  return (
    <div className="annotation-dialog-container">
      <ul className="annotation-dialog-tabs">
        <li
          className={
            annotationStyle === "brush"
              ? "annotation-dialog-tab active-annotation-dialog-tab"
              : "annotation-dialog-tab"
          }
          onClick={() => handleSelectTab("brush")}
          title={t("Brush")}
        >
          <span
            className="icon-edit-line annotation-dialog-tab-icon"
            style={{ fontSize: 18 }}
          ></span>
        </li>
        <li
          className={
            annotationStyle === "highlighter"
              ? "annotation-dialog-tab active-annotation-dialog-tab"
              : "annotation-dialog-tab"
          }
          onClick={() => handleSelectTab("highlighter")}
          title={t("Highlighter")}
        >
          <span
            className="icon-highlight-line annotation-dialog-tab-icon"
            style={{ fontSize: 18 }}
          ></span>
        </li>
        <li
          className={
            annotationStyle === "shape"
              ? "annotation-dialog-tab active-annotation-dialog-tab"
              : "annotation-dialog-tab"
          }
          onClick={() => handleSelectTab("shape")}
          title={t("Shape")}
        >
          <span className="annotation-dialog-tab-shape">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="12" height="10" rx="1" />
            </svg>
          </span>
        </li>
        <li
          className={
            annotationStyle === "text"
              ? "annotation-dialog-tab active-annotation-dialog-tab"
              : "annotation-dialog-tab"
          }
          onClick={() => handleSelectTab("text")}
          title={t("Text")}
        >
          <span className="icon-font annotation-dialog-tab-icon"></span>
        </li>
        <li
          className={
            annotationStyle === "eraser"
              ? "annotation-dialog-tab active-annotation-dialog-tab"
              : "annotation-dialog-tab"
          }
          onClick={() => handleSelectTab("eraser")}
          title={t("Eraser")}
        >
          <span
            className="icon-eraser-line annotation-dialog-tab-icon"
            style={{ fontSize: 18 }}
          ></span>
        </li>
      </ul>

      <div className="annotation-dialog-options">
        {annotationStyle === "brush" ? (
          <>
            <ul className="annotation-color-list" title={t("Brush color")}>
              {BRUSH_COLORS.map((color) => (
                <li
                  key={color}
                  className={
                    annotationBrushColor === color
                      ? "annotation-color-item active-annotation-color-item"
                      : "annotation-color-item"
                  }
                  style={{ backgroundColor: color }}
                  onClick={() => handleSelectColor(color)}
                ></li>
              ))}
            </ul>
            <ul className="annotation-width-list" title={t("Brush width")}>
              {BRUSH_WIDTHS.map((width) => (
                <li
                  key={width}
                  className={
                    annotationBrushWidth === width
                      ? "annotation-width-item active-annotation-width-item"
                      : "annotation-width-item"
                  }
                  onClick={() => handleSelectWidth(width)}
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
          </>
        ) : annotationStyle === "highlighter" ? (
          <>
            <ul
              className="annotation-color-list"
              title={t("Highlighter color")}
            >
              {HIGHLIGHTER_COLORS.map((color) => (
                <li
                  key={color}
                  className={
                    annotationHighlighterColor === color
                      ? "annotation-color-item active-annotation-color-item"
                      : "annotation-color-item"
                  }
                  onClick={() => handleSelectHighlighterColor(color)}
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
            <ul
              className="annotation-width-list"
              title={t("Highlighter width")}
            >
              {HIGHLIGHTER_WIDTHS.map((width) => (
                <li
                  key={width}
                  className={
                    annotationHighlighterWidth === width
                      ? "annotation-width-item active-annotation-width-item"
                      : "annotation-width-item"
                  }
                  onClick={() => handleSelectHighlighterWidth(width)}
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
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={annotationHighlighterOpacity}
              title={t("Opacity")}
              className="annotation-opacity-slider"
              onChange={(e) => handleSelectOpacity(parseFloat(e.target.value))}
              onPointerUp={handleOpacityRelease}
              onMouseUp={handleOpacityRelease}
            />
          </>
        ) : annotationStyle === "shape" ? (
          <>
            <ul className="annotation-shape-list" title={t("Shape type")}>
              {SHAPE_TYPES.map((type) => (
                <li
                  key={type}
                  className={
                    annotationShapeType === type
                      ? "annotation-shape-item active-annotation-shape-item"
                      : "annotation-shape-item"
                  }
                  onClick={() => handleSelectShapeType(type)}
                  title={t(type.charAt(0).toUpperCase() + type.slice(1))}
                >
                  {renderShapeIcon(type)}
                </li>
              ))}
            </ul>
            <ul className="annotation-color-list" title={t("Shape color")}>
              {BRUSH_COLORS.map((color) => (
                <li
                  key={color}
                  className={
                    annotationShapeColor === color
                      ? "annotation-color-item active-annotation-color-item"
                      : "annotation-color-item"
                  }
                  style={{ backgroundColor: color }}
                  onClick={() => handleSelectShapeColor(color)}
                ></li>
              ))}
            </ul>
            <ul className="annotation-width-list" title={t("Shape width")}>
              {BRUSH_WIDTHS.map((width) => (
                <li
                  key={width}
                  className={
                    annotationShapeWidth === width
                      ? "annotation-width-item active-annotation-width-item"
                      : "annotation-width-item"
                  }
                  onClick={() => handleSelectShapeWidth(width)}
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
          </>
        ) : annotationStyle === "eraser" ? (
          <>
            <input
              type="range"
              min={ERASER_WIDTH_MIN}
              max={ERASER_WIDTH_MAX}
              step={ERASER_WIDTH_STEP}
              value={annotationEraserWidth}
              title={`${t("Eraser size")}: ${annotationEraserWidth}`}
              className="annotation-opacity-slider"
              onChange={(e) =>
                handleSelectEraserWidth(parseFloat(e.target.value))
              }
              onPointerUp={handleEraserWidthRelease}
              onMouseUp={handleEraserWidthRelease}
            />
            <div
              className="annotation-quick-erase-container"
              title={t("Quick erase")}
              onClick={handleToggleQuickErase}
            >
              <span
                className="annotation-quick-erase-switch"
                style={
                  annotationQuickErase === "yes"
                    ? { opacity: 1 }
                    : { opacity: 0.4 }
                }
              >
                <span
                  className="annotation-quick-erase-button"
                  style={
                    annotationQuickErase === "yes"
                      ? { transform: "translateX(20px)" }
                      : { transform: "translateX(0px)" }
                  }
                ></span>
              </span>
            </div>
          </>
        ) : (
          <>
            <input
              type="range"
              min={TEXT_SIZE_MIN}
              max={TEXT_SIZE_MAX}
              step={TEXT_SIZE_STEP}
              value={annotationTextSize}
              title={`${t("Text size")}: ${annotationTextSize}`}
              className="annotation-opacity-slider"
              onChange={(e) => handleSelectTextSize(parseFloat(e.target.value))}
              onPointerUp={handleTextSizeRelease}
              onMouseUp={handleTextSizeRelease}
            />
            <select
              className="general-setting-dropdown annotation-text-font-select"
              value={annotationTextFont}
              title={t("Text font")}
              onChange={(e) => handleSelectTextFont(e.target.value)}
            >
              {state.fontOptions.map((font) => (
                <option
                  key={font.value}
                  value={font.value}
                  className="general-setting-option"
                >
                  {font.label}
                </option>
              ))}
            </select>
            <ul className="annotation-color-list" title={t("Text color")}>
              {TEXT_COLORS.map((color) => (
                <li
                  key={color}
                  className={
                    annotationTextColor === color
                      ? "annotation-color-item active-annotation-color-item"
                      : "annotation-color-item"
                  }
                  style={{ backgroundColor: color }}
                  onClick={() => handleSelectTextColor(color)}
                ></li>
              ))}
            </ul>
          </>
        )}
      </div>

      <span
        className="icon-close annotation-dialog-close"
        onClick={handleClose}
        title={t("Close")}
      ></span>
    </div>
  );
};

export default AnnotationDialog;
