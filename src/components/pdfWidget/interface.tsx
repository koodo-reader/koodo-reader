import { RouteComponentProps } from "react-router";
export interface PDFWidgetProps extends RouteComponentProps<any> {
  handleReadingState: (readingState: boolean) => void;
}
export interface PDFWidgetState {
  isHover: boolean;
}
