import "./colorOption.css";
import { ColorProps } from "./interface";
import {
  ConfigService,
  HighlightUtil,
  KookitConfig,
} from "../../assets/lib/kookit-extra-browser.min";

const highlightUtil: any = new HighlightUtil(ConfigService);

const ColorOption = (props: ColorProps) => {
  const handleStyleType = (styleType: string) => {
    const color = KookitConfig.HighlightPresetColors[styleType][0];
    const value = { styleType, color };
    props.handleHighlight(value);
    highlightUtil.saveNoteHighlightValue(value);
  };

  const handlePresetColor = (index: number) => {
    const styleType = props.highlight.styleType;
    const color = KookitConfig.HighlightPresetColors[styleType][index];
    const value = { styleType, color };
    props.handleHighlight(value);
    highlightUtil.saveNoteHighlightValue(value);
    if (!props.isEdit) {
      setTimeout(() => {
        props.handleDigest();
      }, 100);
    }
  };

  const { styleType, color } = props.highlight;
  const presetColors = KookitConfig.HighlightPresetColors[styleType];

  return (
    <div
      className={
        props.isEdit
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
              onClick={() => handleStyleType(item.value)}
              style={
                styleType === item.value
                  ? { borderColor: "currentColor" }
                  : {}
              }
            >
              <span
                className="note-highlight-style-preview"
                style={{
                  ...highlightUtil.buildHighlightPreviewStyle(
                    item.value,
                    previewColor
                  ),
                  ...(item.value === "background"
                    ? { borderRadius: "50%" }
                    : {}),
                }}
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
            onClick={() => handlePresetColor(index)}
          />
        ))}
      </ul>
    </div>
  );
};

export default ColorOption;
