import ConfigService from "../../utils/storage/configService";
const initState = {
  mode: "home",
  shelfTitle: "",
  isCollapsed: ConfigService.getReaderConfig("isCollapsed") === "yes",
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
    case "HANDLE_SHELF":
      return {
        ...state,
        shelfTitle: action.payload,
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
