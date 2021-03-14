export interface TextToSpeechProps {
  currentEpub: any;
  locations: any;
  isReading: boolean;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}
export interface TextToSpeechState {
  isSupported: boolean;
  isAudioOn: boolean;
}
