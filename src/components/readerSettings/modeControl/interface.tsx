export interface ModeControlProps {
  renderBookFunc: () => void;
  t: (title: string) => string;
}

export interface ModeControlState {
  readerMode: string;
}
