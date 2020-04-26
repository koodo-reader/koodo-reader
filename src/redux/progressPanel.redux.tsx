import RecordLocation from "../utils/recordLocation";
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

export function handleLocations(locations: any) {
  return { type: "HANDLE_LOCATIONS", payload: locations };
}
export function handlePercentage(percentage: number) {
  return { type: "HANDLE_PERCENTAGE", payload: percentage };
}
export function handleFetchPercentage(book: { key: string }) {
  return (dispatch: (arg0: { type: string; payload: any }) => void) => {
    let percentage = RecordLocation.getCfi(book.key).percentage;
    dispatch(handlePercentage(percentage));
  };
}
export function handleFetchLocations(epub: any) {
  return (dispatch: (arg0: { type: string; payload: any }) => void) => {
    if (epub.locations !== undefined) {
      epub.locations
        .generate()
        .then((result: any) => {
          let locations = epub.locations;
          dispatch(handleLocations(locations));
        })
        .catch(() => {
          console.log("Error occurs");
        });
    }
  };
}
