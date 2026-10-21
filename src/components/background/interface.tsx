export interface BackgroundProps {
  readerMode: string;
  scale: string;
  isFitPage?: boolean;
  margin: string;
  isNavLocked: boolean;
  isSettingLocked: boolean;
  isDockedRight: boolean;
  backgroundColor: string;
  readerBackgroundImage?: string;
}
export interface BackgroundState {
  isSingle: boolean;
  pageOffset: string;
  pageWidth: string;
  readerBackgroundUrl: string;
}
