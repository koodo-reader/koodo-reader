import BookModel from "../../../models/Book";

export interface EditDialogState {
  isCheck: boolean;
  coverPreview: string;
  bookPath: string;
  isMetadataDialogOpen: boolean;
  pendingName: string;
  pendingAuthor: string;
  pendingPublisher: string;
  pendingDescription: string;
  pendingPublishedDate: string;
  pendingCover: string;
  isAnalyzing: boolean;
}
