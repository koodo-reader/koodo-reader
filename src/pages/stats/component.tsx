import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import "./stats.css";
import { StatsProps, StatsState } from "./interface";
import { Trans } from "react-i18next";
import {
  ConfigService,
  ReadingTimeUtil,
} from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../utils/storage/databaseService";
import {
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const Stats = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const readingTimeUtilRef = useRef<InstanceType<
    typeof ReadingTimeUtil
  > | null>(null);
  if (!readingTimeUtilRef.current) {
    readingTimeUtilRef.current = new ReadingTimeUtil(ConfigService, {
      registerUnloadHandler: () => () => {},
    });
  }

  const [state, setState] = useState<StatsState>({
    totalBooks: 0,
    totalSeconds: 0,
    longestStreak: 0,
    avgDailySeconds: 0,
    last30Days: [],
    heatmapData: [],
    chartTab: "bar",
    isLoading: true,
  });

  const dateToKey = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getHeatmapColor = (seconds: number, isDarkMode: boolean): string => {
    if (seconds === 0)
      return isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    if (seconds < 300) return isDarkMode ? "#0e4429" : "#9be9a8";
    if (seconds < 900) return isDarkMode ? "#006d32" : "#40c463";
    if (seconds < 1800) return isDarkMode ? "#26a641" : "#30a14e";
    return isDarkMode ? "#39d353" : "#216e39";
  };

  const isDark = (): boolean => {
    const skin = ConfigService.getReaderConfig("appSkin");
    const isOSNight = ConfigService.getReaderConfig("isOSNight");
    return skin === "night" || (skin === "system" && isOSNight === "yes");
  };

  const loadStats = async () => {
    const readingTimeUtil = readingTimeUtilRef.current;
    if (!readingTimeUtil) return;

    // ── 1. Books read (has a recordLocation) ──────────────────────────────
    let allBookKeys: string[] = [];
    try {
      allBookKeys = await DatabaseService.getAllRecordKeys("books");
    } catch (e) {
      allBookKeys = [];
    }
    let totalBooks = 0;
    for (const key of allBookKeys) {
      const loc = ConfigService.getObjectConfig(key, "recordLocation", null);
      if (loc && Object.keys(loc).length > 0) {
        totalBooks++;
      }
    }

    // ── 2. Total reading time from readingStats ────────────────────────────
    const allDates = readingTimeUtil.getAllDates();
    let totalSeconds = 0;
    const dateSecondsMap: Record<string, number> = {};
    for (const dateKey of allDates) {
      const dayStats = readingTimeUtil.getDayStats(dateKey);
      const dayTotal = dayStats.reduce((sum, s) => sum + s.seconds, 0);
      totalSeconds += dayTotal;
      dateSecondsMap[dateKey] = dayTotal;
    }

    // ── 3. Longest streak (consecutive reading days up to today) ──────────
    const datesWithReading = new Set(
      allDates.filter((d) => (dateSecondsMap[d] || 0) > 0)
    );
    const today = new Date();
    let longestStreak = 0;
    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = dateToKey(d);
      if (datesWithReading.has(key)) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // ── 4. Daily average ──────────────────────────────────────────────────
    const activeDays = Object.values(dateSecondsMap).filter(
      (s) => s > 0
    ).length;
    const avgDailySeconds =
      activeDays > 0 ? Math.round(totalSeconds / activeDays) : 0;

    // ── 5. Last 30 days data ──────────────────────────────────────────────
    const last30Days: { date: string; seconds: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = dateToKey(d);
      last30Days.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        seconds: dateSecondsMap[key] || 0,
      });
    }

    // ── 6. Heatmap: last 52 weeks ─────────────────────────────────────────
    const heatmapData: { date: string; seconds: number }[] = [];
    const heatmapStart = new Date(today);
    heatmapStart.setDate(today.getDate() - 51 * 7);
    heatmapStart.setDate(heatmapStart.getDate() - heatmapStart.getDay());
    for (
      const d = new Date(heatmapStart);
      d <= today;
      d.setDate(d.getDate() + 1)
    ) {
      const key = dateToKey(d);
      heatmapData.push({ date: key, seconds: dateSecondsMap[key] || 0 });
    }

    setState((prev) => ({
      ...prev,
      totalBooks,
      totalSeconds,
      longestStreak,
      avgDailySeconds,
      last30Days,
      heatmapData,
      isLoading: false,
    }));
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderHeatmap = () => {
    const { heatmapData } = state;
    const darkMode = isDark();

    // Build week columns: each column is 7 days (Sun–Sat)
    // We need to figure out which day of week the first date falls on
    const padded: ({ date: string; seconds: number } | null)[] = [
      ...heatmapData,
      ...Array((7 - (heatmapData.length % 7 || 7)) % 7).fill(null),
    ];

    // Split into columns of 7
    const weeks: ({ date: string; seconds: number } | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7));
    }

    // Month labels
    const monthLabels: { label: string; colIndex: number }[] = [];
    weeks.forEach((week, wi) => {
      const firstVisibleCell = week.find((cell) => cell !== null);
      const monthStartCell =
        wi === 0
          ? firstVisibleCell
          : week.find((cell) => cell && new Date(cell.date).getDate() === 1);

      if (monthStartCell) {
        const d = new Date(monthStartCell.date);
        monthLabels.push({
          label: d.toLocaleString("default", { month: "short" }),
          colIndex: wi,
        });
      }
    });

    const weekDays = ["", "Mon", "", "Wed", "", "Fri", ""];
    const legendLevels = [0, 200, 600, 1200, 2400];

    return (
      <div>
        <div className="heatmap-layout">
          <div className="heatmap-side">
            <div className="heatmap-month-spacer" />
            <div className="heatmap-weekdays">
              {weekDays.map((d, i) => (
                <div key={i} className="heatmap-weekday-label">
                  {d}
                </div>
              ))}
            </div>
          </div>
          <div className="heatmap-main">
            <div className="heatmap-months">
              {weeks.map((_, wi) => {
                const label = monthLabels.find((ml) => ml.colIndex === wi);
                return (
                  <div key={wi} className="heatmap-month-label">
                    {label ? label.label : ""}
                  </div>
                );
              })}
            </div>
            <div className="heatmap-grid">
              {weeks.map((week, wi) => (
                <div key={wi} className="heatmap-col">
                  {week.map((cell, di) =>
                    cell === null ? (
                      <div
                        key={di}
                        className="heatmap-cell"
                        style={{ visibility: "hidden" }}
                      />
                    ) : (
                      <div
                        key={di}
                        className="heatmap-cell"
                        title={`${cell.date}: ${formatTime(cell.seconds)}`}
                        style={{
                          backgroundColor: getHeatmapColor(
                            cell.seconds,
                            darkMode
                          ),
                        }}
                      />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Legend */}
        <div className="heatmap-legend">
          {legendLevels.map((lvl) => (
            <div
              key={lvl}
              className="heatmap-legend-cell"
              style={{
                backgroundColor: getHeatmapColor(lvl, darkMode),
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  const {
    totalBooks,
    totalSeconds,
    longestStreak,
    avgDailySeconds,
    last30Days,
    chartTab,
    isLoading,
  } = state;

  const darkMode = isDark();
  const bgColor = darkMode ? "#1e1e1e" : "#f5f5f5";
  const cardBg = darkMode ? "#2a2a2a" : "#ffffff";
  const textColor = darkMode ? "#e0e0e0" : "#333333";
  const chartColor = textColor;
  const lineChartColor = darkMode ? "#ffb066" : "#ff6b1a";
  const lineChartGradientId = `stats-line-gradient-${
    darkMode ? "dark" : "light"
  }`;
  const gridColor = darkMode
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.08)";
  const tabActiveBg = darkMode ? "#3a3a3a" : "#333";
  const tabActiveColor = darkMode ? "#fff" : "#fff";
  const tabInactiveBg = darkMode
    ? "rgba(255,255,255,0.06)"
    : "rgba(0,0,0,0.06)";
  const tabInactiveColor = darkMode
    ? "rgba(255,255,255,0.6)"
    : "rgba(0,0,0,0.5)";

  const cards = [
    {
      icon: "icon-bookshelf",
      value: totalBooks,
      label: t("Books read"),
      color: textColor,
      iconSize: 24,
    },
    {
      icon: "icon-grid",
      value: formatTime(totalSeconds),
      label: t("Total reading time"),
      color: textColor,
      iconSize: 22,
    },
    {
      icon: "icon-clock",
      value: `${longestStreak}`,
      label: t("Reading streak (days)"),
      color: textColor,
      iconSize: 28,
    },
    {
      icon: "icon-chart",
      value: formatTime(avgDailySeconds),
      label: t("Daily average"),
      color: textColor,
      iconSize: 22,
    },
  ];

  const chartData = last30Days.map((d) => ({
    ...d,
    minutes: Math.round(d.seconds / 60),
  }));

  return (
    <div
      className="stats-page"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* Close button */}
      <div
        className="stats-close-btn"
        style={{ color: textColor }}
        onClick={() => {
          navigate("/manager/home");
        }}
      >
        <span className="icon-close"></span>
      </div>

      {/* Title */}
      <div className="stats-title">
        <Trans>Reading Stats</Trans>
      </div>

      {/* Cards */}
      {!isLoading && (
        <>
          <div className="stats-cards">
            {cards.map((card, i) => (
              <div
                key={i}
                className="stats-card"
                style={{ backgroundColor: cardBg }}
              >
                <div
                  className="stats-card-icon"
                  style={{ color: card.color, fontSize: card.iconSize }}
                >
                  <span className={card.icon}></span>
                </div>
                <div
                  className="stats-card-value"
                  style={{ color: textColor }}
                >
                  {card.value}
                </div>
                <div className="stats-card-label">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div
            className="stats-chart-wrapper"
            style={{ backgroundColor: cardBg }}
          >
            <div className="stats-section-title">
              <Trans>Last 30 Days</Trans>
            </div>
            <div className="stats-chart-tabs">
              <button
                className="stats-chart-tab"
                style={{
                  backgroundColor:
                    chartTab === "bar" ? tabActiveBg : tabInactiveBg,
                  color:
                    chartTab === "bar" ? tabActiveColor : tabInactiveColor,
                }}
                onClick={() =>
                  setState((prev) => ({ ...prev, chartTab: "bar" }))
                }
              >
                <Trans>Bar Chart</Trans>
              </button>
              <button
                className="stats-chart-tab"
                style={{
                  backgroundColor:
                    chartTab === "line" ? tabActiveBg : tabInactiveBg,
                  color:
                    chartTab === "line" ? tabActiveColor : tabInactiveColor,
                }}
                onClick={() =>
                  setState((prev) => ({ ...prev, chartTab: "line" }))
                }
              >
                <Trans>Line Chart</Trans>
              </button>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              {chartTab === "bar" ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: textColor, opacity: 0.5 }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: textColor, opacity: 0.5 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}m`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} min`]}
                    contentStyle={{
                      backgroundColor: cardBg,
                      border: "none",
                      borderRadius: 8,
                      color: textColor,
                      fontSize: 12,
                    }}
                    cursor={{
                      fill: darkMode
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    }}
                  />
                  <Bar
                    dataKey="minutes"
                    fill={chartColor}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
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
                    dataKey="date"
                    tick={{ fontSize: 11, fill: textColor, opacity: 0.5 }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: textColor, opacity: 0.5 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}m`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} min`]}
                    contentStyle={{
                      backgroundColor: cardBg,
                      border: "none",
                      borderRadius: 8,
                      color: textColor,
                      fontSize: 12,
                    }}
                    cursor={{
                      fill: darkMode
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    }}
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
          </div>

          {/* Heatmap */}
          <div
            className="stats-heatmap-wrapper"
            style={{ backgroundColor: cardBg }}
          >
            <div className="stats-section-title">
              <Trans>Reading Activity</Trans>
            </div>
            {renderHeatmap()}
          </div>
        </>
      )}
    </div>
  );
};

export default Stats;
