import BookModel from "../../../models/Book";

export interface PdfCropDialogProps {
  currentBook: BookModel;
  handlePdfCropDialog: (isPdfCropOpen: boolean) => void;


  t: (title: string) => string;
}

export interface PdfCropDialogState {
  top: number;
  bottom: number;
  left: number;
  right: number;
}
