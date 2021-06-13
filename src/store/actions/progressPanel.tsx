import RecordLocation from "../../utils/readUtils/recordLocation";
export function handleLocations(locations: any) {
  return { type: "HANDLE_LOCATIONS", payload: locations };
}
export function handlePercentage(percentage: number) {
  return { type: "HANDLE_PERCENTAGE", payload: percentage };
}
export function handleFetchPercentage(book: { key: string }) {
  return (dispatch: (arg0: { type: string; payload: any }) => void) => {
    let percentage;
    if (RecordLocation.getScrollHeight(book.key).scroll) {
      percentage =
        RecordLocation.getScrollHeight(book.key).scroll /
        RecordLocation.getScrollHeight(book.key).length;
    } else {
      percentage = RecordLocation.getCfi(book.key).percentage;
    }
    console.log(book.key, percentage, RecordLocation.getScrollHeight(book.key));
    dispatch(handlePercentage(percentage));
  };
}
export function handleFetchLocations(epub: any) {
  return (dispatch: (arg0: { type: string; payload: any }) => void) => {
    epub.locations
      .generate()
      .then((result: any) => {
        dispatch(handleLocations(epub.locations));
      })
      .catch(() => {
        console.log("Error occurs");
      });
  };
}
