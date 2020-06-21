export interface WelcomePageProps {
  handleCloseWelcome: () => void;
  handleFirst: (isFirst: string) => void;
}

export interface WelcomePageState {
  currentIndex: number;
  isOpenWelcome: boolean;
}
