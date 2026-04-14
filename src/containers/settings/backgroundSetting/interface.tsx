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
  appBackgroundId: string;
  readerBackgroundId: string;
  isLoading: boolean;
}
