export interface MetadataDialogProps {
  t: (title: string) => string;
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
}

export interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    description?: string;
    publishedDate?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}
export interface AppleBookItem {
  artistIds?: number[];
  trackCensoredName: string;
  artistViewUrl?: string;
  trackViewUrl?: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
  artistId?: number;
  artistName: string;
  genres?: string[];
  price?: number;
  releaseDate?: string;
  trackName: string;
  trackId: number;
  genreIds?: string[];
  kind?: string;
  currency?: string;
  description?: string;
  formattedPrice?: string;
}

export interface MetadataDialogState {
  searchName: string;
  searchAuthor: string;
  results: AppleBookItem[];
  selectedId: string | null;
  isLoading: boolean;
  error: string;
}
