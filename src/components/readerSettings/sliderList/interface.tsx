export interface SliderListProps {
  maxValue: string;
  minValue: string;
  mode: string;
  step: number;
  title: string;
  minLabel: string;
  maxLabel: string;
  renderBookFunc: () => void;
  renderBookWithLineColorsFunc: () => void;
  t: (title: string) => string;
}
export interface SliderListState {
  value: string;
  inputValue: string;
  isTyping: boolean;
  isEntered: boolean;
}
