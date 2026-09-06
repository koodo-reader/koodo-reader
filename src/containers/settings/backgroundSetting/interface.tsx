import { RouteComponentProps } from "react-router-dom";

export interface SettingInfoProps extends RouteComponentProps<any> {
  t: (title: string) => string;
  handleReaderBackgroundImage?: (readerBackgroundImage: string) => void;
}

export interface BackgroundImage {
  id: string;
  name: string;
  extension: string;
  textColor?: string;
  backgroundColor?: string;
}

export interface SettingInfoState {
  images: BackgroundImage[];
  /** loaded dataUrls keyed by image id */
  loadedUrls: Record<string, string>;
  previewImage: BackgroundImage | null;
  /** featured background index currently in preview */
  previewFeatured: number | null;
  appBackgroundId: string;
  readerBackgroundId: string;
  isLoading: boolean;
  /** featured indexes whose thumbnail has entered the viewport */
  visibleFeatured: Set<number>;
  /** id of the featured background being downloaded */
  downloadingId: string;
  downloadProgress: number;
}
