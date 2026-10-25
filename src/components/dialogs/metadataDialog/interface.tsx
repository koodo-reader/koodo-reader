export interface MetadataDialogProps {
  currentBookName: string;
  currentBookAuthor: string;
  handleMetadataDialog: (isShow: boolean) => void;
  handleApplyMetadata: (metadata: MetadataResult) => void;
}

export interface MetadataResult {
  name?: string;
  author?: string;
  publisher?: string;
  description?: string;
  publishedDate?: string;
  cover?: string;
  published?: string;
  modified?: string;
  identifier?: string;
  language?: string;
  subject?: string;
  rights?: string;
  isbn?: string;
  layout?: string;
}

export interface CloudBookItem {
  key: string;
  name: string;
  author: string;
  publisher?: string;
  description?: string;
  cover?: string;
  isbn?: string;
  rating_source?: string;
  rating?: number;
  rating_count?: number;
  categories?: string;
  pub_date?: string;
  language?: string;
  pages?: number;
}

export type BookResultItem = CloudBookItem;

export interface MetadataDialogState {
  searchName: string;
  searchAuthor: string;
  results: BookResultItem[];
  selectedId: string | null;
  isLoading: boolean;
  error: string;
}
