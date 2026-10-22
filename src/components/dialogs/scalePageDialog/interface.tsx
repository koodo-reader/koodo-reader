export interface ScalePageDialogProps {
  scale: string;
  isFitPage: boolean;
  isSettingLocked: boolean;
  isDockedRight: boolean;
  handleScale: (scale: string) => void;
  handleFitPage: (isFitPage: boolean) => void;
  handleScalePageDialog: (isScalePageOpen: boolean) => void;
  renderBookFunc: () => void;
  t: (title: string) => string;
}

export interface ScalePageDialogState {
  scale: string;
}
