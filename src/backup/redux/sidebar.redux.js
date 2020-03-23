const initState = {
  mode: "home",
  shelfIndex: null
  // cover:''
};
export function sidebar(state = initState, action) {
  switch (action.type) {
    case "HANDLE_MODE":
      return {
        ...state,
        mode: action.payload
      };
    case "HANDLE_SHELF_INDEX":
      return {
        ...state,
        shelfIndex: action.payload
      };
    default:
      return state;
  }
}

export function handleShelfIndex(shelfIndex) {
  console.log(shelfIndex);
  return { type: "HANDLE_SHELF_INDEX", payload: shelfIndex };
}

export function handleMode(mode) {
  console.log(mode);
  return { type: "HANDLE_MODE", payload: mode };
}
