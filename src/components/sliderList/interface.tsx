export interface SliderListProps {
  currentEpub: any;
  maxValue: string;
  minValue: string;
  mode: string;
  step: number;
  minLabel: string;
  maxLabel: string;
  handleMessageBox: (isShow: boolean) => void;
  handleMessage: (message: string) => void;
}
export interface SliderListState {
  value: string;
}
