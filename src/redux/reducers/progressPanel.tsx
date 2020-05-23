const initState = {
  percentage: null,
  locations: null,
};
export function progressPanel(
  state = initState,
  action: { type: string; payload: any }
) {
  switch (action.type) {
    case "HANDLE_PERCENTAGE":
      return {
        ...state,
        percentage: action.payload,
      };

    case "HANDLE_SECTION":
      return {
        ...state,
        section: action.payload,
      };
    case "HANDLE_LOCATIONS":
      return {
        ...state,
        locations: action.payload,
      };
    default:
      return state;
  }
}
