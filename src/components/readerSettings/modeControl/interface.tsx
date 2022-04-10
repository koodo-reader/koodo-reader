export interface ModeControlProps {
  renderFunc: () => void;
  t: (title: string) => string;
}

export interface ModeControlState {
  readerMode: string;
}
