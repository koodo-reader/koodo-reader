export interface SliderListProps {
  currentEpub: any;
  maxValue: string;
  minValue: string;
  mode: string;
  step: number;
  title: string;
  minLabel: string;
  maxLabel: string;
  renderFunc: () => void;
  t: (title: string) => string;
}
export interface SliderListState {
  value: string;
}
