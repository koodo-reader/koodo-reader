import RecordLocation from "../../utils/readUtils/recordLocation";
import BookModel from "../../models/Book";
export function handleLocations(locations: any) {
  return { type: "HANDLE_LOCATIONS", payload: locations };
}
export function handlePercentage(percentage: number) {
  return { type: "HANDLE_PERCENTAGE", payload: percentage };
}
export function handleFetchPercentage(book: BookModel) {
  return (dispatch: (arg0: { type: string; payload: any }) => void) => {
    let percentage = RecordLocation.getHtmlLocation(book.key).percentage || 0;

    dispatch(handlePercentage(percentage));
  };
}
