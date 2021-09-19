export interface ModeControlProps {
  renderFunc: () => void;
  t: (title: string) => string;
  currentEpub: any;
}

export interface ModeControlState {
  readerMode: string;
}
