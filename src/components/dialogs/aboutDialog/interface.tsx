export interface AboutDialogProps {
  isSettingOpen: boolean;
  isAboutOpen: boolean;
  isNewWarning: boolean;
  handleSetting: (isSettingOpen: boolean) => void;
  handleAbout: (isAboutOpen: boolean) => void;
}
export interface AboutDialogState {}
