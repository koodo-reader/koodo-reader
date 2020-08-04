import RecordLocation from "../../utils/recordLocation";
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
    epub.locations &&
      epub.locations
        .generate()
        .then((result: any) => {
          let locations = epub.locations;
          dispatch(handleLocations(locations));
        })
        .catch(() => {
          console.log("Error occurs");
        });
  };
}
