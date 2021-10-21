export interface SliderListProps {
  currentEpub: any;
  maxValue: string;
  minValue: string;
  mode: string;
  step: number;
  title: string;
  minLabel: string;
  maxLabel: string;
  renderFunc: (id: string) => void;
  t: (title: string) => string;
}
export interface SliderListState {
  value: string;
}
