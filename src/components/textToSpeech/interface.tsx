export interface TextToSpeechProps {
  currentEpub: any;
  locations: any;
  isReading: boolean;
  t: (title: string) => string;
}
export interface TextToSpeechState {
  isSupported: boolean;
  isAudioOn: boolean;
  voices: any;
}
