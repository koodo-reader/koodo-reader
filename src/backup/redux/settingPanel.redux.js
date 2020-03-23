import readerConfig from "../utils/readerConfig";
const config = readerConfig.get();
const initState = {
  fontSize: config.fontSize, // 0 代表使用默认值
  theme: config.theme, //代表使用默认值
  fontFamily: config.fontFamily, //代表默认使用思源黑体
  fontWeight: config.fontWeight, //代表使用默认值
  lineHeight: config.lineHeight, // 0 代表使用默认值
  letterSpacing: config.letterSpacing, // 0 代表使用默认值
  wordSpacing: config.wordSpacing, // 0 代表使用默认值
  column: config.column, // 可取值为1, 2
  padding: config.padding // 阅读区域与浏览器可视区域上下的间距
};
export function settingPanel(state = initState, action) {
  switch (action.type) {
    case "CHANGE_FONT_SIZE":
      return {
        ...state,
        fontSize: action.payload
      };
    case "CHANGE_BACKGROUND":
      return {
        ...state,
        background: action.payload
      };
    case "CHANGE_FONT":
      return {
        ...state,
        fontFamily: action.payload
      };
    case "CHANGE_FONT_WEIGHT":
      return {
        ...state,
        fontWeight: action.payload
      };
    case "CHANGE_LINE_HEIGHT":
      return {
        ...state,
        lineHeight: action.payload
      };
    case "CHANGE_PADDING":
      return {
        ...state,
        padding: action.payload
      };
    case "CHANGE_WORD_SPACING":
      return {
        ...state,
        wordSpacing: action.payload
      };
    case "CHANGE_COLUMN":
      return {
        ...state,
        column: action.payload
      };
    default:
      return state;
  }
}

export function changeFontSize(fontSize) {
  return { type: "CHANGE_FONT_SIZE", payload: fontSize };
}
export function changeBackground(background) {
  return { type: "CHANGE_BACKGROUND", payload: background };
}
export function changeFont(fontFamily) {
  return { type: "CHANGE_FONT", payload: fontFamily };
}
export function changeFontWeight(fontWeight) {
  return { type: "CHANGE_FONT_WEIGHT", payload: fontWeight };
}
export function changeLineHeight(lineHeight) {
  return { type: "CHANGE_LINE_HEIGHT", payload: lineHeight };
}
export function changePadding(padding) {
  return { type: "CHANGE_PADDING", payload: padding };
}
export function changeWordSpacing(wordSpacing) {
  return { type: "CHANGE_WORD_SPACING", payload: wordSpacing };
}
export function changeColumn(column) {
  return { type: "CHANGE_COLUMN", payload: column };
}
