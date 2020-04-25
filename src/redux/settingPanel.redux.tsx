const initState = {
  fontSize: localStorage.getItem("fontSize") || "17",
  theme: localStorage.getItem("theme") || "rgba(255,254,252,1)",
  fontFamily: localStorage.getItem("fontFamily") || "Helvetica",
  lineHeight: localStorage.getItem("lineHeight") || "1.25",
  padding: localStorage.getItem("padding") || "50",
};
export function settingPanel(state = initState, action) {
  switch (action.type) {
    case "CHANGE_FONT_SIZE":
      return {
        ...state,
        fontSize: action.payload,
      };
    case "CHANGE_BACKGROUND":
      return {
        ...state,
        background: action.payload,
      };
    case "CHANGE_FONT":
      return {
        ...state,
        fontFamily: action.payload,
      };
    case "CHANGE_FONT_WEIGHT":
      return {
        ...state,
        fontWeight: action.payload,
      };
    case "CHANGE_LINE_HEIGHT":
      return {
        ...state,
        lineHeight: action.payload,
      };
    case "CHANGE_PADDING":
      return {
        ...state,
        padding: action.payload,
      };
    case "CHANGE_WORD_SPACING":
      return {
        ...state,
        wordSpacing: action.payload,
      };
    case "CHANGE_COLUMN":
      return {
        ...state,
        column: action.payload,
      };
    default:
      return state;
  }
}

export function changeFontSize(fontSize: string) {
  return { type: "CHANGE_FONT_SIZE", payload: fontSize };
}
export function changeBackground(background: string) {
  return { type: "CHANGE_BACKGROUND", payload: background };
}
export function changeFont(fontFamily: string) {
  return { type: "CHANGE_FONT", payload: fontFamily };
}
export function changeFontWeight(fontWeight: string) {
  return { type: "CHANGE_FONT_WEIGHT", payload: fontWeight };
}
export function changeLineHeight(lineHeight: string) {
  return { type: "CHANGE_LINE_HEIGHT", payload: lineHeight };
}
export function changePadding(padding: string) {
  return { type: "CHANGE_PADDING", payload: padding };
}
export function changeWordSpacing(wordSpacing: string) {
  return { type: "CHANGE_WORD_SPACING", payload: wordSpacing };
}
export function changeColumn(column: number) {
  return { type: "CHANGE_COLUMN", payload: column };
}
