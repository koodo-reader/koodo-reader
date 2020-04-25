import RecordLocation from "../utils/recordLocation";
const initState = {
  percentage: null,
  section: null,
  locations: null,
};
export function progressPanel(state = initState, action) {
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

export function handleSection(section) {
  return { type: "HANDLE_SECTION", payload: section };
}
export function handleLocations(locations) {
  return { type: "HANDLE_LOCATIONS", payload: locations };
}
export function handlePercentage(percentage) {
  return { type: "HANDLE_PERCENTAGE", payload: percentage };
}
export function handleFetchPercentage(book) {
  return (dispatch) => {
    let percentage = RecordLocation.getCfi(book.key).percentage;
    dispatch(handlePercentage(percentage));
  };
}
export function handleFetchLocations(epub) {
  return (dispatch) => {
    if (epub.locations !== undefined) {
      epub.locations
        .generate()
        .then((result) => {
          let locations = epub.locations;
          dispatch(handleLocations(locations));
        })
        .catch(() => {
          console.log("Error occurs");
        });
    }
  };
}
