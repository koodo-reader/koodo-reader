export interface WindowControlsProps {
  t: (key: string) => string;
}

export interface ReaderWindowState {
  isMaximized: boolean;
  isFullScreen: boolean;
}

export type WindowControlsState = ReaderWindowState;
