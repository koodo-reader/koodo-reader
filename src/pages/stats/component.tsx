import React from "react";
import "./stats.css";
import { StatsProps, StatsState } from "./interface";
import { withRouter } from "react-router-dom";
import { withTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { ReadingTimeUtil } from "../../utils/reader/readingTimeUtil";
import DatabaseService from "../../utils/storage/databaseService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

class Stats extends React.Component<StatsProps, StatsState> {
  constructor(props: StatsProps) {
    super(props);
    this.state = {
      totalBooks: 0,
      totalSeconds: 0,
      longestStreak: 0,
      avgDailySeconds: 0,
      last30Days: [],
      heatmapData: [],
      chartTab: "bar",
      isLoading: true,
    };
  }

  componentDidMount() {
    this.loadStats();
  }

  loadStats = async () => {
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
    const allDates = ReadingTimeUtil.getAllDates();
    let totalSeconds = 0;
    const dateSecondsMap: Record<string, number> = {};
    for (const dateKey of allDates) {
      const dayStats = ReadingTimeUtil.getDayStats(dateKey);
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
      const key = this.dateToKey(d);
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
      const key = this.dateToKey(d);
      last30Days.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        seconds: dateSecondsMap[key] || 0,
      });
    }

    // ── 6. Heatmap: last 52 weeks ─────────────────────────────────────────
    const heatmapData: { date: string; seconds: number }[] = [];
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = this.dateToKey(d);
      heatmapData.push({ date: key, seconds: dateSecondsMap[key] || 0 });
    }

    this.setState({
      totalBooks,
      totalSeconds,
      longestStreak,
      avgDailySeconds,
      last30Days,
      heatmapData,
      isLoading: false,
    });
  };

  dateToKey(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  getHeatmapColor(seconds: number, isDark: boolean): string {
    if (seconds === 0)
      return isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    if (seconds < 300) return isDark ? "#0e4429" : "#9be9a8";
    if (seconds < 900) return isDark ? "#006d32" : "#40c463";
    if (seconds < 1800) return isDark ? "#26a641" : "#30a14e";
    return isDark ? "#39d353" : "#216e39";
  }

  isDark(): boolean {
    const skin = ConfigService.getReaderConfig("appSkin");
    const isOSNight = ConfigService.getReaderConfig("isOSNight");
    return skin === "night" || (skin === "system" && isOSNight === "yes");
  }

  renderHeatmap() {
    const { heatmapData } = this.state;
    const isDark = this.isDark();

    // Build week columns: each column is 7 days (Sun–Sat)
    // We need to figure out which day of week the first date falls on
    const firstDate = new Date(heatmapData[0]?.date || "");
    const startDow = firstDate.getDay(); // 0=Sun

    // Pad beginning with empty cells
    const padded: ({ date: string; seconds: number } | null)[] = [
      ...Array(startDow).fill(null),
      ...heatmapData,
    ];

    // Split into columns of 7
    const weeks: ({ date: string; seconds: number } | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7));
    }

    // Month labels
    const monthLabels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstNonNull = week.find((c) => c !== null);
      if (firstNonNull) {
        const d = new Date(firstNonNull.date);
        const m = d.getMonth();
        if (m !== lastMonth) {
          monthLabels.push({
            label: d.toLocaleString("default", { month: "short" }),
            colIndex: wi,
          });
          lastMonth = m;
        }
      }
    });

    const weekDays = ["", "Mon", "", "Wed", "", "Fri", ""];
    const legendLevels = [0, 200, 600, 1200, 2400];

    return (
      <div>
        {/* Month row */}
        <div style={{ display: "flex", marginLeft: 28, marginBottom: 4 }}>
          {weeks.map((_, wi) => {
            const label = monthLabels.find((ml) => ml.colIndex === wi);
            return (
              <div
                key={wi}
                className="heatmap-month-label"
                style={{ width: 16, flexShrink: 0 }}
              >
                {label ? label.label : ""}
              </div>
            );
          })}
        </div>
        <div className="heatmap-container">
          {/* Weekday labels */}
          <div className="heatmap-weekdays">
            {weekDays.map((d, i) => (
              <div key={i} className="heatmap-weekday-label">
                {d}
              </div>
            ))}
          </div>
          {/* Grid */}
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
                      title={`${cell.date}: ${this.formatTime(cell.seconds)}`}
                      style={{
                        backgroundColor: this.getHeatmapColor(
                          cell.seconds,
                          isDark
                        ),
                      }}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="heatmap-legend">
          {legendLevels.map((lvl) => (
            <div
              key={lvl}
              className="heatmap-legend-cell"
              style={{
                backgroundColor: this.getHeatmapColor(lvl, isDark),
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  render() {
    const {
      totalBooks,
      totalSeconds,
      longestStreak,
      avgDailySeconds,
      last30Days,
      chartTab,
      isLoading,
    } = this.state;

    const isDark = this.isDark();
    const bgColor = isDark ? "#1e1e1e" : "#f5f5f5";
    const cardBg = isDark ? "#2a2a2a" : "#ffffff";
    const textColor = isDark ? "#e0e0e0" : "#333333";
    const chartColor = textColor;
    const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const tabActiveBg = isDark ? "#3a3a3a" : "#333";
    const tabActiveColor = isDark ? "#fff" : "#fff";
    const tabInactiveBg = isDark
      ? "rgba(255,255,255,0.06)"
      : "rgba(0,0,0,0.06)";
    const tabInactiveColor = isDark
      ? "rgba(255,255,255,0.6)"
      : "rgba(0,0,0,0.5)";

    const cards = [
      {
        icon: "icon-bookshelf",
        value: totalBooks,
        label: this.props.t("Books read"),
        color: textColor,
        iconSize: 24,
      },
      {
        icon: "icon-grid",
        value: this.formatTime(totalSeconds),
        label: this.props.t("Total reading time"),
        color: textColor,
        iconSize: 20,
      },
      {
        icon: "icon-clock",
        value: `${longestStreak}`,
        label: this.props.t("Reading streak (days)"),
        color: textColor,
        iconSize: 24,
      },
      {
        icon: "icon-chart",
        value: this.formatTime(avgDailySeconds),
        label: this.props.t("Daily average"),
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
            this.props.history.push("/manager/home");
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

            {/* Heatmap */}
            <div
              className="stats-heatmap-wrapper"
              style={{ backgroundColor: cardBg }}
            >
              <div className="stats-section-title">
                <Trans>Reading Activity</Trans>
              </div>
              {this.renderHeatmap()}
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
                  onClick={() => this.setState({ chartTab: "bar" })}
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
                  onClick={() => this.setState({ chartTab: "line" })}
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
                      formatter={(value: any) => [`${value} min`, ""]}
                      contentStyle={{
                        backgroundColor: cardBg,
                        border: "none",
                        borderRadius: 8,
                        color: textColor,
                        fontSize: 12,
                      }}
                      cursor={{
                        fill: isDark
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
                  <LineChart
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
                      formatter={(value: any) => [`${value} min`, ""]}
                      contentStyle={{
                        backgroundColor: cardBg,
                        border: "none",
                        borderRadius: 8,
                        color: textColor,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="minutes"
                      stroke={chartColor}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    );
  }
}

export default withRouter(Stats as any);
