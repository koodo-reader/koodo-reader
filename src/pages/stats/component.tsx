import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ConfigService,
  ReadingTimeUtil,
} from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../utils/storage/databaseService";
import CoverUtil from "../../utils/file/coverUtil";
import Book from "../../models/Book";
import RangeFilter from "../../components/stats/rangeFilter";
import BookPicker from "../../components/stats/bookPicker";
import ReadingChart from "../../components/stats/readingChart";
import ReadingHeatmap from "../../components/stats/readingHeatmap";
import EmptyCover from "../../components/emptyCover";
import {
  ChartTab,
  Preset,
  RangePreset,
  ReadingChartPoint,
  ReadingRange,
} from "../../components/stats/types";
import { formatDayLabel } from "../../components/stats/utils";
import "./stats.css";

const PRESET_LABELS: Record<Preset, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "3m": "Last 3 Months",
  "6m": "Last 6 Months",
  "1y": "Last Year",
};

export interface StatsProps {
  t: (title: string) => string;
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
            setFitByWidth(img.naturalHeight / img.naturalWidth > 150 / 105);
          }}
        />
      ) : (
        <EmptyCover
          format={item.format}
          title={item.name}
          author={item.author}
          scale={1}
        />
      )}
    </div>
  );
};

export interface StatsState {
  totalBooks: number;
  totalSeconds: number;
  longestStreak: number;
  avgDailySeconds: number;
  chartDays: { date: string; seconds: number }[];
  earliestDate: string;
  bookKeys: string[];
  bookNamesMap: Record<string, string>;
  bookAuthorsMap: Record<string, string>;
  bookKey: string;
  leaderboard: LeaderboardBook[];
  heatmapData: { date: string; seconds: number }[];
  range: ReadingRange;
  chartTab: ChartTab;
  isLoading: boolean;
}

const Stats = () => {
  const { t, i18n } = useTranslation();
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
    bookAuthorsMap: {},
    bookKey: "",
    leaderboard: [],
    heatmapData: [],
    range: { preset: "30d", ...readingTimeUtil.getDateRange("30d") },
    chartTab: "bar",
    isLoading: true,
  }));

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
    const bookRecords = bookKeys.length
      ? await DatabaseService.getRecordsByKeys(bookKeys, "books")
      : [];
    const bookRecordMap: Record<string, Book> = {};
    const bookNamesMap: Record<string, string> = {};
    const bookAuthorsMap: Record<string, string> = {};
    for (const record of bookRecords) {
      bookRecordMap[record.key] = record;
      bookNamesMap[record.key] = record.name;
      bookAuthorsMap[record.key] = record.author;
    }

    // ── 4. Reading time leaderboard (top 9 books) ──────────────────────
    const bookTotals = readingTimeUtil.getBookTotals() as Record<
      string,
      number
    >;
    const topBooks = Object.entries(bookTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 9);
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
    const today = new Date();
    const longestStreak = readingTimeUtil.getLongestStreak(dateSecondsMap);

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
      const key = ReadingTimeUtil.dateToKey(d);
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
      bookAuthorsMap,
      leaderboard,
      heatmapData,
      isLoading: false,
    }));
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRangePresetChange = (preset: Preset) => {
    setState((prev) => {
      const range: ReadingRange = {
        preset,
        ...readingTimeUtil.getDateRange(preset),
      };
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

  const handleApplyCustomRange = (start: string, end: string) => {
    setState((prev) => ({
      ...prev,
      range: { preset: "custom", start, end },
      chartDays: readingTimeUtil.getRangeStats(start, end, prev.bookKey),
    }));
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

  const handleChartTabChange = (chartTab: ChartTab) => {
    setState((prev) => ({ ...prev, chartTab }));
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
    bookAuthorsMap,
    bookKey,
    leaderboard,
    heatmapData,
    range,
    chartTab,
    isLoading,
  } = state;

  const darkMode = isDark();
  const bgColor = darkMode ? "#1e1e1e" : "#f5f5f5";
  const cardBg = darkMode ? "#2a2a2a" : "#ffffff";
  const textColor = darkMode ? "#e0e0e0" : "#333333";
  const pageStyle = {
    backgroundColor: bgColor,
    color: textColor,
    "--stats-text": textColor,
    "--stats-card-bg": cardBg,
    "--stats-border": darkMode ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)",
    "--stats-hover-bg": darkMode
      ? "rgba(255,255,255,0.08)"
      : "rgba(0,0,0,0.05)",
    "--stats-range-bg": darkMode
      ? "rgba(255,255,255,0.12)"
      : "rgba(0,0,0,0.07)",
    "--stats-muted": darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
  };

  const cards = [
    {
      icon: "icon-bookshelf",
      value: totalBooks,
      label: t("Books read"),
      iconSize: 24,
    },
    {
      icon: "icon-grid",
      value: ReadingTimeUtil.formatDuration(totalSeconds),
      label: t("Total reading time"),
      iconSize: 22,
    },
    {
      icon: "icon-clock",
      value: `${longestStreak}`,
      label: t("Reading streak (days)"),
      iconSize: 28,
    },
    {
      icon: "icon-chart",
      value: ReadingTimeUtil.formatDuration(avgDailySeconds),
      label: t("Daily average"),
      iconSize: 22,
    },
  ];

  const todayKey = ReadingTimeUtil.dateToKey(new Date());
  const earliestKey = earliestDate || range.start;
  const bookOptions = bookKeys
    .map((key) => ({
      key,
      name: bookNamesMap[key] || key,
      author: bookAuthorsMap[key] || "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  // Desktop keeps its previous bucketing rule: daily up to ~3 months,
  // weekly beyond (the mobile chart switches to monthly/yearly sooner).
  const chartData: ReadingChartPoint[] = ReadingTimeUtil.bucketStats(
    chartDays,
    {
      lang: i18n.language,
      dailyLimit: 92,
      weeklyLimit: Number.POSITIVE_INFINITY,
    }
  ).map((point) => ({
    ...point,
    minutes: Math.round(point.seconds / 60),
  }));
  const rangeTitle =
    range.preset === "custom"
      ? `${formatDayLabel(range.start, i18n.language)} – ${formatDayLabel(
          range.end,
          i18n.language
        )}`
      : t(PRESET_LABELS[range.preset]);
  const tickInterval = Math.max(0, Math.ceil(chartData.length / 8) - 1);

  return (
    <div className="stats-page" style={pageStyle}>
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

      {!isLoading && (
        <>
          <div className="stats-cards">
            {cards.map((card, index) => (
              <div
                key={index}
                className="stats-card"
                style={{ backgroundColor: cardBg }}
              >
                <div
                  className="stats-card-icon"
                  style={{ color: textColor, fontSize: card.iconSize }}
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
              <div className="stats-chart-heading">
                <div className="stats-section-title">{rangeTitle}</div>
                <RangeFilter
                  range={range}
                  minKey={earliestKey}
                  maxKey={todayKey}
                  onPresetChange={handleRangePresetChange}
                  onApplyCustom={handleApplyCustomRange}
                />
              </div>
              <div className="stats-chart-actions">
                <div className="stats-chart-tabs">
                  <button
                    type="button"
                    className={`stats-chart-tab${
                      chartTab === "bar" ? " is-active" : ""
                    }`}
                    aria-label={t("Bar Chart")}
                    aria-pressed={chartTab === "bar"}
                    title={t("Bar Chart")}
                    onClick={() => handleChartTabChange("bar")}
                  >
                    <svg
                      className="stats-chart-tab-icon"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <rect x="4.5" y="11" width="2.5" height="9" rx="1.7" />
                      <rect x="10.3" y="4" width="2.5" height="16" rx="1.7" />
                      <rect x="16.1" y="7.5" width="2.5" height="12.5" rx="1.7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`stats-chart-tab${
                      chartTab === "line" ? " is-active" : ""
                    }`}
                    aria-label={t("Line Chart")}
                    aria-pressed={chartTab === "line"}
                    title={t("Line Chart")}
                    onClick={() => handleChartTabChange("line")}
                  >
                    <svg
                      className="stats-chart-tab-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 15.5L9 10.5L13.5 15L20 8.5" />
                    </svg>
                  </button>
                </div>
                <BookPicker
                  options={bookOptions}
                  value={bookKey}
                  onSelect={handleBookChange}
                />
              </div>
            </div>
            <ReadingChart
              data={chartData}
              chartTab={chartTab}
              darkMode={darkMode}
              tickInterval={tickInterval}
            />
          </div>

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
                      <div className="stats-leaderboard-rank">
                        {index + 1}
                      </div>
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
                          {ReadingTimeUtil.formatDuration(item.seconds)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ReadingHeatmap
            data={heatmapData}
            darkMode={darkMode}
            cardBg={cardBg}
          />
        </>
      )}
    </div>
  );
};

export default Stats;
