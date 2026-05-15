export interface MetadataDialogProps {
  t: (title: string) => string;
  isAuthed: boolean;
  currentBookName: string;
  currentBookAuthor: string;
  handleSetting: (isSettingOpen: boolean) => void;
  handleSettingMode: (mode: string) => void;
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

export interface OpenLibraryBookItem {
  key: string;
  title: string;
  author_name?: string[];
  publisher?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  description?: string;
  source: "openlibrary";
}
export interface CloudBookItem {
  key: string;
  name: string;
  author: string;
  publisher?: string;
  description?: string;
  cover?: string;
  source: "cloud";
}

export type BookResultItem =
  | (AppleBookItem & { source: "itunes" })
  | OpenLibraryBookItem
  | CloudBookItem;

export interface MetadataDialogState {
  searchName: string;
  searchAuthor: string;
  results: BookResultItem[];
  selectedId: string | null;
  isCloudSearch: boolean;
  isLoading: boolean;
  error: string;
}
