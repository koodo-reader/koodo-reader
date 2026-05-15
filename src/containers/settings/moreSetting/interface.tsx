import { RouteComponentProps } from "react-router-dom";

export interface MoreSettingProps extends RouteComponentProps<any> {
  t: (title: string) => string;
}

export interface MoreSettingState {
  protectionMethod: string;
  biometricAvailable: boolean;
  pinInputMode: "none" | "setup-enter" | "setup-confirm" | "verify";
  pinValue: string;
  pinFirstValue: string;
  pinCallback: ((pin: string | false) => void) | null;
}
