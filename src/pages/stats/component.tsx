import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./stats.css";
import { Trans } from "react-i18next";
import {
  ConfigService,
  ReadingTimeUtil,
} from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../utils/storage/databaseService";
import BookUtil from "../../utils/file/bookUtil";
import CoverUtil from "../../utils/file/coverUtil";
import EmptyCover from "../../components/emptyCover";
import Book from "../../models/Book";
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

type RangePreset = "7d" | "30d" | "3m" | "6m" | "1y" | "custom";

interface ChartPoint {
  /** short x-axis label, e.g. "3/4" */
  label: string;
  seconds: number;
  /** tooltip label, e.g. "2025-03-04" or "2025-03-04 – 2025-03-10" */
  title: string;
}

interface LeaderboardBook {
  key: string;
  name: string;
  author: string;
  format: string;
  cover: string;
  isCoverExist: boolean;
  seconds: number;
}

const LeaderboardCover = ({ item }: { item: LeaderboardBook }) => {
  const [fitByWidth, setFitByWidth] = useState(true);
  return (
    <div className="stats-leaderboard-cover">
      {item.isCoverExist ? (
        <img
          src={item.cover}
          alt=""
          draggable={false}
          className="stats-leaderboard-image"
          style={fitByWidth ? { width: "100%" } : { height: "100%" }}
          onLoad={(event) => {
            const img = event.currentTarget;
            setFitByWidth(img.naturalHeight / img.naturalWidth > 137 / 105);
          }}
        />
      ) : (
        <EmptyCover format={item.format} title={item.name} scale={1} />
      )}
    </div>
  );
};

const PRESET_LABELS: Record<Exclude<RangePreset, "custom">, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "3m": "Last 3 Months",
  "6m": "Last 6 Months",
  "1y": "Last Year",
};

const WEEK_DAYS = 7;
const CHART_DAILY_LIMIT_DAYS = 92;

const dateToKey = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Daily stats → chart points. Ranges longer than ~3 months are aggregated
 * by week so the bars stay readable.
 */
const toChartPoints = (
  daily: { date: string; seconds: number }[]
): ChartPoint[] => {
  const step = daily.length > CHART_DAILY_LIMIT_DAYS ? WEEK_DAYS : 1;
  const points: ChartPoint[] = [];
  for (let i = 0; i < daily.length; i += step) {
    const chunk = daily.slice(i, i + step);
    const startKey = chunk[0].date;
    const endKey = chunk[chunk.length - 1].date;
    const [, month, day] = startKey.split("-").map(Number);
    points.push({
      label: `${month}/${day}`,
      seconds: chunk.reduce((sum, item) => sum + item.seconds, 0),
      title: startKey === endKey ? startKey : `${startKey} – ${endKey}`,
    });
  }
  return points;
};

export interface StatsProps {
  t: (title: string) => string;
}

export interface StatsState {
  totalBooks: number;
  totalSeconds: number;
  longestStreak: number;
  avgDailySeconds: number;
  chartDays: { date: string; seconds: number }[];
  earliestDate: string;
  bookKeys: string[];
  bookNamesMap: Record<string, string>;
  bookKey: string;
  leaderboard: LeaderboardBook[];
  heatmapData: { date: string; seconds: number }[];
  range: { preset: RangePreset; start: string; end: string };
  chartTab: "line" | "bar";
  isLoading: boolean;
}

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
  const readingTimeUtil = readingTimeUtilRef.current;

  const [state, setState] = useState<StatsState>(() => ({
    totalBooks: 0,
    totalSeconds: 0,
    longestStreak: 0,
    avgDailySeconds: 0,
    chartDays: [],
    earliestDate: "",
    bookKeys: [],
    bookNamesMap: {},
    bookKey: "",
    leaderboard: [],
    heatmapData: [],
    range: { preset: "30d", ...readingTimeUtil.getDateRange("30d") },
    chartTab: "bar",
    isLoading: true,
  }));

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
    const dateSecondsMap = readingTimeUtil.getDailyTotals() as Record<
      string,
      number
    >;
    let totalSeconds = 0;
    for (const seconds of Object.values(dateSecondsMap)) {
      totalSeconds += seconds;
    }
    const earliestDate = Object.keys(dateSecondsMap).sort()[0] || "";

    // ── 3. Book filter options (books with recorded reading time) ─────
    const bookKeys = readingTimeUtil.getAllBookKeys();
    const bookNamesMap = await BookUtil.getBookNamesMapByKeys(bookKeys);

    // ── 4. Reading time leaderboard (top 10 books) ──────────────────────
    const bookTotals = readingTimeUtil.getBookTotals() as Record<
      string,
      number
    >;
    const topBooks = Object.entries(bookTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    const bookRecords = topBooks.length
      ? await DatabaseService.getRecordsByKeys(
          topBooks.map(([key]) => key),
          "books"
        )
      : [];
    const bookRecordMap: Record<string, Book> = {};
    for (const record of bookRecords) {
      bookRecordMap[record.key] = record;
    }
    const leaderboard: LeaderboardBook[] = [];
    for (const [key, seconds] of topBooks) {
      const book = bookRecordMap[key];
      if (!book) continue;
      let cover = await CoverUtil.getCover(book);
      if (
        cover &&
        !cover.startsWith("data:") &&
        !cover.startsWith("blob:") &&
        !cover.startsWith("http")
      ) {
        cover = cover + "?t=" + Date.now();
      }
      leaderboard.push({
        key,
        name: book.name,
        author: book.author,
        format: book.format,
        cover,
        isCoverExist: await CoverUtil.isCoverExist(book),
        seconds,
      });
    }

    // ── 5. Longest streak (consecutive reading days up to today) ──────────
    const datesWithReading = new Set(
      Object.keys(dateSecondsMap).filter((d) => dateSecondsMap[d] > 0)
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

    // ── 6. Daily average ──────────────────────────────────────────────────
    const activeDays = Object.values(dateSecondsMap).filter(
      (s) => s > 0
    ).length;
    const avgDailySeconds =
      activeDays > 0 ? Math.round(totalSeconds / activeDays) : 0;

    // ── 7. Heatmap: last 52 weeks ─────────────────────────────────────────
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
      chartDays: readingTimeUtil.getRangeStats(
        prev.range.start,
        prev.range.end,
        prev.bookKey
      ),
      earliestDate,
      bookKeys,
      bookNamesMap,
      leaderboard,
      heatmapData,
      isLoading: false,
    }));
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRangePresetChange = (preset: RangePreset) => {
    setState((prev) => {
      const range: StatsState["range"] =
        preset === "custom"
          ? { ...prev.range, preset }
          : { preset, ...readingTimeUtil.getDateRange(preset) };
      return {
        ...prev,
        range,
        chartDays: readingTimeUtil.getRangeStats(
          range.start,
          range.end,
          prev.bookKey
        ),
      };
    });
  };

  const handleCustomDateChange = (field: "start" | "end", value: string) => {
    if (!value) return;
    setState((prev) => {
      const range = { ...prev.range };
      range[field] = value;
      if (field === "start" && value > range.end) range.end = value;
      if (field === "end" && value < range.start) range.start = value;
      return {
        ...prev,
        range,
        chartDays: readingTimeUtil.getRangeStats(
          range.start,
          range.end,
          prev.bookKey
        ),
      };
    });
  };

  const handleBookChange = (bookKey: string) => {
    setState((prev) => ({
      ...prev,
      bookKey,
      chartDays: readingTimeUtil.getRangeStats(
        prev.range.start,
        prev.range.end,
        bookKey
      ),
    }));
  };

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
    chartDays,
    earliestDate,
    bookKeys,
    bookNamesMap,
    bookKey,
    leaderboard,
    range,
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
  const gridColor = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const tabActiveBg = darkMode ? "#3a3a3a" : "#333";
  const tabActiveColor = darkMode ? "#fff" : "#fff";
  const tabInactiveBg = darkMode
    ? "rgba(255,255,255,0.06)"
    : "rgba(0,0,0,0.06)";
  const tabInactiveColor = darkMode
    ? "rgba(255,255,255,0.6)"
    : "rgba(0,0,0,0.5)";
  const selectBg = darkMode ? "#333333" : "#f0f0f0";
  const selectStyle = {
    backgroundColor: selectBg,
    color: textColor,
    colorScheme: darkMode ? "dark" : "light",
  };
  const optionStyle = {
    backgroundColor: darkMode ? selectBg : cardBg,
    color: textColor,
  };

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

  const todayKey = dateToKey(new Date());
  const earliestKey = earliestDate || range.start;
  const bookOptions = bookKeys
    .map((key) => ({ key, name: bookNamesMap[key] || key }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const chartData = toChartPoints(chartDays).map((point) => ({
    ...point,
    minutes: Math.round(point.seconds / 60),
  }));
  const rangeTitle =
    range.preset === "custom"
      ? `${range.start} – ${range.end}`
      : t(PRESET_LABELS[range.preset]);
  const tickInterval = Math.max(0, Math.ceil(chartData.length / 8) - 1);

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
                <div className="stats-card-value" style={{ color: textColor }}>
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
            <div className="stats-chart-header">
              <div className="stats-section-title">{rangeTitle}</div>
              <div className="stats-chart-filters">
                <select
                  className="stats-range-select stats-book-select"
                  value={bookKey}
                  onChange={(e) => handleBookChange(e.target.value)}
                  style={selectStyle}
                >
                  <option value="" style={optionStyle}>
                    {t("All books")}
                  </option>
                  {bookOptions.map((book) => (
                    <option key={book.key} value={book.key} style={optionStyle}>
                      {book.name}
                    </option>
                  ))}
                </select>
                <select
                  className="stats-range-select"
                  value={range.preset}
                  onChange={(e) =>
                    handleRangePresetChange(e.target.value as RangePreset)
                  }
                  style={selectStyle}
                >
                  {(["7d", "30d", "3m", "6m", "1y"] as const).map((preset) => (
                    <option key={preset} value={preset} style={optionStyle}>
                      {t(PRESET_LABELS[preset])}
                    </option>
                  ))}
                  <option value="custom" style={optionStyle}>
                    {t("Custom range")}
                  </option>
                </select>
              </div>
            </div>
            {range.preset === "custom" && (
              <div className="stats-range-custom">
                <input
                  type="date"
                  className="stats-range-date"
                  value={range.start}
                  min={earliestKey}
                  max={todayKey}
                  aria-label={t("Start date")}
                  onChange={(e) =>
                    handleCustomDateChange("start", e.target.value)
                  }
                  style={{
                    color: textColor,
                    colorScheme: darkMode ? "dark" : "light",
                  }}
                />
                <span className="stats-range-sep">–</span>
                <input
                  type="date"
                  className="stats-range-date"
                  value={range.end}
                  min={earliestKey}
                  max={todayKey}
                  aria-label={t("End date")}
                  onChange={(e) =>
                    handleCustomDateChange("end", e.target.value)
                  }
                  style={{
                    color: textColor,
                    colorScheme: darkMode ? "dark" : "light",
                  }}
                />
              </div>
            )}
            <div className="stats-chart-tabs">
              <button
                className="stats-chart-tab"
                style={{
                  backgroundColor:
                    chartTab === "bar" ? tabActiveBg : tabInactiveBg,
                  color: chartTab === "bar" ? tabActiveColor : tabInactiveColor,
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
                    dataKey="label"
                    tick={{ fontSize: 11, fill: textColor, opacity: 0.5 }}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: textColor, opacity: 0.5 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}m`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} min`]}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.title || label
                    }
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
                    dataKey="label"
                    tick={{ fontSize: 11, fill: textColor, opacity: 0.5 }}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: textColor, opacity: 0.5 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}m`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} min`]}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.title || label
                    }
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

          {/* Reading time leaderboard */}
          {leaderboard.length > 0 && (
            <div
              className="stats-leaderboard-wrapper"
              style={{ backgroundColor: cardBg }}
            >
              <div className="stats-section-title">
                <Trans>Reading Time Leaderboard</Trans>
              </div>
              <div className="stats-leaderboard">
                {leaderboard.map((item, index) => (
                  <div className="stats-leaderboard-card" key={item.key}>
                    <LeaderboardCover item={item} />
                    <div className="stats-leaderboard-info">
                      <div className="stats-leaderboard-rank">{index + 1}</div>
                      <div className="stats-leaderboard-text">
                        <div
                          className="stats-leaderboard-name"
                          title={item.name}
                        >
                          {item.name}
                        </div>
                        <div
                          className="stats-leaderboard-author"
                          title={item.author}
                        >
                          {item.author || t("Unknown Author")}
                        </div>
                        <div className="stats-leaderboard-time">
                          {formatTime(item.seconds)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
