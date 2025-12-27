import BookModel from "../../models/Book";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
export function handlePercentage(percentage: number) {
  return { type: "HANDLE_PERCENTAGE", payload: percentage };
}
export function handleFetchPercentage(book: BookModel) {
  return (dispatch: (arg0: { type: string; payload: any }) => void) => {
    let percentage =
      ConfigService.getObjectConfig(book.key, "recordLocation", {})
        .percentage || 0;

    dispatch(handlePercentage(percentage));
  };
}
