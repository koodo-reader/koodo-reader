import OtherUtil from "../../utils/otherUtil";
const initState = {
  mode: "home",
  shelfIndex: -1,
  isCollapsed: OtherUtil.getReaderConfig("isCollapsed") === "yes",
};
export function sidebar(
  state = initState,
  action: { type: string; payload: any }
) {
  switch (action.type) {
    case "HANDLE_MODE":
      return {
        ...state,
        mode: action.payload,
      };
    case "HANDLE_SHELF_INDEX":
      return {
        ...state,
        shelfIndex: action.payload,
      };
    case "HANDLE_COLLAPSE":
      return {
        ...state,
        isCollapsed: action.payload,
      };
    default:
      return state;
  }
}
