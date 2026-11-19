import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTab, ReadingChartPoint } from "../types";

export interface ReadingChartProps {
  data: ReadingChartPoint[];
  chartTab: ChartTab;
  darkMode: boolean;
  tickInterval: number;
}

const ReadingChart = ({
  data,
  chartTab,
  darkMode,
  tickInterval,
}: ReadingChartProps) => {
  const cardBg = darkMode ? "#2a2a2a" : "#ffffff";
  const textColor = darkMode ? "#e0e0e0" : "#333333";
  const lineChartColor = darkMode ? "#ffb066" : "#ff6b1a";
  const lineChartGradientId = `stats-line-gradient-${
    darkMode ? "dark" : "light"
  }`;
  const gridColor = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const tick = { fontSize: 11, fill: textColor, opacity: 0.5 };
  const tooltipStyle = {
    backgroundColor: cardBg,
    border: "none",
    borderRadius: 8,
    color: textColor,
    fontSize: 12,
  };
  const tooltipCursor = {
    fill: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
  };
  const margin = { top: 5, right: 10, left: -10, bottom: 5 };

  return (
    <ResponsiveContainer width="100%" height={220}>
      {chartTab === "bar" ? (
        <BarChart data={data} margin={margin}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={tick}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
          />
          <YAxis
            tick={tick}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}m`}
          />
          <Tooltip
            formatter={(value: any) => [`${value} min`]}
            labelFormatter={(label, payload) =>
              payload?.[0]?.payload?.title || label
            }
            contentStyle={tooltipStyle}
            cursor={tooltipCursor}
          />
          <Bar dataKey="minutes" fill={textColor} radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <AreaChart data={data} margin={margin}>
          <defs>
            <linearGradient
              id={lineChartGradientId}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={lineChartColor}
                stopOpacity={0.32}
              />
              <stop
                offset="70%"
                stopColor={lineChartColor}
                stopOpacity={0.1}
              />
              <stop
                offset="100%"
                stopColor={lineChartColor}
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={tick}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
          />
          <YAxis
            tick={tick}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}m`}
          />
          <Tooltip
            formatter={(value: any) => [`${value} min`]}
            labelFormatter={(label, payload) =>
              payload?.[0]?.payload?.title || label
            }
            contentStyle={tooltipStyle}
            cursor={tooltipCursor}
          />
          <Area
            type="monotone"
            dataKey="minutes"
            stroke="none"
            fill={`url(#${lineChartGradientId})`}
          />
          <Line
            type="monotone"
            dataKey="minutes"
            stroke={lineChartColor}
            strokeWidth={2.5}
            dot={false}
            strokeLinecap="round"
            strokeLinejoin="round"
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
};

export default ReadingChart;
