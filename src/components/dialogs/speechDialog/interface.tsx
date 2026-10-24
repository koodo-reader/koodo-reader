import Plugin from "../../../models/Plugin";

export interface SpeechDialogProps {
  isSettingOpen: boolean;
  isSettingLocked: boolean;
  isDockedRight: boolean;
  isAboutOpen: boolean;


  handleSpeechDialog: (isAboutOpen: boolean) => void;
  handleFetchPlugins: () => void;

  t: (title: string) => string;
  plugins: Plugin[];
}
export interface SpeechDialogState {

}
