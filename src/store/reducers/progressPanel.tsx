const initState = {
  percentage: null,
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
    default:
      return state;
  }
}
