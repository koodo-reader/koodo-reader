import RecordLocation from "../../utils/readUtils/recordLocation";
import BookModel from "../../model/Book";
export function handleLocations(locations: any) {
  return { type: "HANDLE_LOCATIONS", payload: locations };
}
export function handlePercentage(percentage: number) {
  return { type: "HANDLE_PERCENTAGE", payload: percentage };
}
export function handleFetchPercentage(book: BookModel) {
  return (dispatch: (arg0: { type: string; payload: any }) => void) => {
    let percentage;
    if (RecordLocation.getScrollHeight(book.key).chapter) {
      percentage =
        JSON.parse(book.content || "[]").lastIndexOf(
          RecordLocation.getScrollHeight(book.key).chapter
        ) / JSON.parse(book.content || "[]").length;
    } else {
      percentage = RecordLocation.getCfi(book.key).percentage;
    }
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
