export type RangePreset = "7d" | "30d" | "3m" | "6m" | "1y" | "custom";

export type Preset = Exclude<RangePreset, "custom">;

export type ChartTab = "bar" | "line";

export interface ReadingRange {
  preset: RangePreset;
  start: string;
  end: string;
}

export interface BookOption {
  key: string;
  name: string;
  author: string;
}

export interface ReadingChartPoint {
  label: string;
  title: string;
  seconds: number;
  minutes: number;
}
