export interface WelcomeDialogProps {
  handleCloseWelcome: () => void;
  handleFirst: (isFirst: string) => void;
}

export interface WelcomeDialogState {
  currentIndex: number;
  isOpenWelcome: boolean;
}
