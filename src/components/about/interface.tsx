export interface AboutProps {
  handleMessage: (message: string) => void;
  handleMessageBox: (isShow: boolean) => void;
}
export interface AboutState {
  isNew: boolean;
  isGithub: boolean;
  isContact: boolean;
  isDonate: boolean;
}
