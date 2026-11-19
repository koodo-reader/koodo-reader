import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./stats.css";
import { Trans } from "react-i18next";
import {
  ConfigService,
  ReadingTimeUtil,
} from "../../assets/lib/kookit-extra-browser.min";
import DatabaseService from "../../utils/storage/databaseService";
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

interface RangePickerProps {
  range: { start: string; end: string };
  minKey: string;
  maxKey: string;
  onApply: (start: string, end: string) => void;
}

interface CalendarCell {
  /** YYYY-MM-DD */
  key: string;
  day: number;
}

/** `YYYY-MM-DD` → `YYYY-MM` */
const getMonthKey = (dateKey: string): string => dateKey.slice(0, 7);

/** Shift a `YYYY-MM` key by `delta` months. */
const shiftMonthKey = (monthKey: string, delta: number): string => {
  const [year, month] = monthKey.split("-").map(Number);
  return ReadingTimeUtil.dateToKey(
    new Date(year, month - 1 + delta, 1)
  ).slice(0, 7);
};

/** Seven-column month grid padded with nulls, week starts on Sunday. */
const buildMonthGrid = (monthKey: string): (CalendarCell | null)[] => {
  const [year, month] = monthKey.split("-").map(Number);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (CalendarCell | null)[] = new Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      key: ReadingTimeUtil.dateToKey(new Date(year, month - 1, day)),
      day,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
};

/** Localized label for a `YYYY-MM-DD` key, e.g. `May 1, 2025`. */
const formatDayLabel = (dateKey: string, lang: string): string => {
  try {
    return new Intl.DateTimeFormat(ReadingTimeUtil.getDateLocale(lang), {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(ReadingTimeUtil.parseDateKey(dateKey));
  } catch (error) {
    return dateKey;
  }
};

const RangePicker = ({ range, minKey, maxKey, onApply }: RangePickerProps) => {
  const { t, i18n } = useTranslation();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getMonthKey(range.end)
  );
  const [draftStart, setDraftStart] = useState(range.start);
  const [draftEnd, setDraftEnd] = useState<string | null>(range.end);
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const previewEnd = draftEnd || hoverKey;
  const from =
    draftStart && previewEnd
      ? draftStart <= previewEnd
        ? draftStart
        : previewEnd
      : null;
  const to =
    draftStart && previewEnd
      ? draftStart <= previewEnd
        ? previewEnd
        : draftStart
      : null;

  const cells = buildMonthGrid(visibleMonth);
  const weekdays = ReadingTimeUtil.getWeekdayLabels(i18n.language, "narrow");
  const minMonth = getMonthKey(minKey);
  const maxMonth = getMonthKey(maxKey);

  const handleDayClick = (key: string) => {
    if (!draftStart || draftEnd) {
      setDraftStart(key);
      setDraftEnd(null);
      setHoverKey(null);
      return;
    }
    onApply(
      key < draftStart ? key : draftStart,
      key < draftStart ? draftStart : key
    );
  };

  // Keep the popover inside the window when the trigger sits near the edge.
  useLayoutEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;
    const margin = 12;
    const rect = popover.getBoundingClientRect();
    let shift = 0;
    if (rect.right > window.innerWidth - margin) {
      shift = window.innerWidth - margin - rect.right;
    }
    if (rect.left + shift < margin) {
      shift = margin - rect.left;
    }
    if (shift !== 0) {
      popover.style.left = `${shift}px`;
    }
  }, []);

  return (
    <div className="stats-range-popover" role="dialog" ref={popoverRef}>
      <div className="stats-range-popover-title">
        {t("Select the first day, then the last day")}
      </div>
      <div className="stats-calendar-header">
        <button
          type="button"
          className="stats-calendar-nav"
          aria-label={t("Previous month")}
          disabled={visibleMonth <= minMonth}
          onClick={() => setVisibleMonth(shiftMonthKey(visibleMonth, -1))}
        >
          <span className="icon-dropdown stats-calendar-nav-icon is-previous" />
        </button>
        <div className="stats-calendar-month">
          {ReadingTimeUtil.formatMonthYearLabel(
            ReadingTimeUtil.parseDateKey(`${visibleMonth}-01`),
            i18n.language
          )}
        </div>
        <button
          type="button"
          className="stats-calendar-nav"
          aria-label={t("Next month")}
          disabled={visibleMonth >= maxMonth}
          onClick={() => setVisibleMonth(shiftMonthKey(visibleMonth, 1))}
        >
          <span className="icon-dropdown stats-calendar-nav-icon is-next" />
        </button>
      </div>
      <div className="stats-calendar-weekdays">
        {weekdays.map((label, index) => (
          <div key={index} className="stats-calendar-weekday">
            {label}
          </div>
        ))}
      </div>
      <div className="stats-calendar-days">
        {cells.map((cell, index) => {
          if (!cell) {
            return <span key={`empty-${index}`} />;
          }
          const classNames = ["stats-calendar-day"];
          if (from && to && cell.key > from && cell.key < to) {
            classNames.push("is-in-range");
          }
          if (cell.key === from) {
            classNames.push("is-start");
          }
          if (cell.key === to) {
            classNames.push("is-end");
          }
          return (
            <button
              key={cell.key}
              type="button"
              className={classNames.join(" ")}
              disabled={cell.key < minKey || cell.key > maxKey}
              onClick={() => handleDayClick(cell.key)}
              onMouseEnter={() => {
                if (draftStart && !draftEnd) {
                  setHoverKey(cell.key);
                }
              }}
              onMouseLeave={() => {
                if (!draftEnd) {
                  setHoverKey(null);
                }
              }}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
      <div className="stats-calendar-footer">
        <span className="icon-clock stats-calendar-footer-icon" />
        <span>
          {formatDayLabel(from || range.start, i18n.language)} –{" "}
          {formatDayLabel(to || range.end, i18n.language)}
        </span>
      </div>
    </div>
  );
};

interface BookOption {
  key: string;
  name: string;
  author: string;
}

interface BookPickerProps {
  options: BookOption[];
  value: string;
  onSelect: (bookKey: string) => void;
}

const BookPicker = ({ options, value, onSelect }: BookPickerProps) => {
  const { t } = useTranslation();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const keyword = query.trim().toLowerCase();
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(keyword)
  );

  // Keep the popover inside the window when the trigger sits near the edge.
  useLayoutEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;
    const margin = 12;
    const rect = popover.getBoundingClientRect();
    if (rect.left < margin) {
      popover.style.right = `${rect.left - margin}px`;
    }
  }, []);

  return (
    <div className="stats-book-popover" role="dialog" ref={popoverRef}>
      <div className="stats-book-popover-title">{t("Filter by book")}</div>
      <input
        className="stats-book-search"
        type="text"
        value={query}
        autoFocus
        placeholder={t("Search {{count}} books", {
          count: options.length,
        })}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="stats-book-list">
        <button
          type="button"
          className={`stats-book-option${value === "" ? " is-selected" : ""}`}
          onClick={() => onSelect("")}
        >
          <span className="icon-check stats-book-check" aria-hidden="true" />
          <span className="stats-book-option-name">{t("All books")}</span>
        </button>
        {filteredOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`stats-book-option${
              value === option.key ? " is-selected" : ""
            }`}
            onClick={() => onSelect(option.key)}
          >
            <span className="icon-check stats-book-check" aria-hidden="true" />
            <span className="stats-book-option-text">
              <span className="stats-book-option-name" title={option.name}>
                {option.name}
              </span>
              <span className="stats-book-option-meta">
                {option.author || t("Unknown Author")}
              </span>
            </span>
          </button>
        ))}
        {filteredOptions.length === 0 && (
          <div className="stats-book-empty">{t("No results found")}</div>
        )}
      </div>
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

const PRESET_SHORT_LABELS: Record<Exclude<RangePreset, "custom">, string> = {
  "7d": "7 Days",
  "30d": "30 Days",
  "3m": "3 Months",
  "6m": "6 Months",
  "1y": "1 Year",
};

const PRESETS: Exclude<RangePreset, "custom">[] = [
  "7d",
  "30d",
  "3m",
  "6m",
  "1y",
];

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
  bookAuthorsMap: Record<string, string>;
  bookKey: string;
  leaderboard: LeaderboardBook[];
  heatmapData: { date: string; seconds: number }[];
  range: { preset: RangePreset; start: string; end: string };
  chartTab: "line" | "bar";
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
  const pickerRef = useRef<HTMLDivElement>(null);
  const bookPickerRef = useRef<HTMLDivElement>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false);

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

  useEffect(() => {
    if (!isPickerOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPickerOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPickerOpen]);

  useEffect(() => {
    if (!isBookPickerOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!bookPickerRef.current?.contains(event.target as Node)) {
        setIsBookPickerOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsBookPickerOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBookPickerOpen]);

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

  const handleApplyCustomRange = (start: string, end: string) => {
    setState((prev) => ({
      ...prev,
      range: { preset: "custom", start, end },
      chartDays: readingTimeUtil.getRangeStats(start, end, prev.bookKey),
    }));
    setIsPickerOpen(false);
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
          label: ReadingTimeUtil.formatMonthLabel(d.getMonth(), i18n.language),
          colIndex: wi,
        });
      }
    });

    const weekdayLabels = ReadingTimeUtil.getWeekdayLabels(
      i18n.language,
      "short"
    );
    const weekDays = weekdayLabels.map((label, index) =>
      index % 2 === 1 ? label : ""
    );
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
                        title={`${cell.date}: ${ReadingTimeUtil.formatDuration(cell.seconds)}`}
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
    bookAuthorsMap,
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
      color: textColor,
      iconSize: 24,
    },
    {
      icon: "icon-grid",
      value: ReadingTimeUtil.formatDuration(totalSeconds),
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
      value: ReadingTimeUtil.formatDuration(avgDailySeconds),
      label: t("Daily average"),
      color: textColor,
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
  const selectedBookName = bookKey
    ? bookNamesMap[bookKey] || bookKey
    : t("All books");
  // Desktop keeps its previous bucketing rule: daily up to ~3 months,
  // weekly beyond (the mobile chart switches to monthly/yearly sooner).
  const chartData = ReadingTimeUtil.bucketStats(chartDays, {
    lang: i18n.language,
    dailyLimit: 92,
    weeklyLimit: Number.POSITIVE_INFINITY,
  }).map((point) => ({
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
              <div className="stats-chart-heading">
                <div className="stats-section-title">{rangeTitle}</div>
                <div className="stats-range-tabs">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`stats-range-pill${
                        range.preset === preset ? " is-active" : ""
                      }`}
                      onClick={() => handleRangePresetChange(preset)}
                    >
                      {t(PRESET_SHORT_LABELS[preset])}
                    </button>
                  ))}
                  <div className="stats-range-picker" ref={pickerRef}>
                    <button
                      type="button"
                      className={`stats-range-pill${
                        range.preset === "custom" ? " is-active" : ""
                      }`}
                      aria-expanded={isPickerOpen}
                      aria-haspopup="dialog"
                      onClick={() => setIsPickerOpen((open) => !open)}
                    >
                      <svg
                        className="stats-range-pill-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <line x1="8" y1="3" x2="8" y2="7" />
                        <line x1="16" y1="3" x2="16" y2="7" />
                      </svg>
                      {t("Custom")}
                    </button>
                    {isPickerOpen && (
                      <RangePicker
                        range={range}
                        minKey={earliestKey}
                        maxKey={todayKey}
                        onApply={handleApplyCustomRange}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="stats-book-picker" ref={bookPickerRef}>
                <button
                  type="button"
                  className="stats-range-pill is-active stats-book-trigger"
                  aria-expanded={isBookPickerOpen}
                  aria-haspopup="dialog"
                  onClick={() => setIsBookPickerOpen((open) => !open)}
                >
                  <span className="stats-book-trigger-label">
                    {selectedBookName}
                  </span>
                  <span className="icon-dropdown stats-book-trigger-icon" />
                </button>
                {isBookPickerOpen && (
                  <BookPicker
                    options={bookOptions}
                    value={bookKey}
                    onSelect={(key) => {
                      handleBookChange(key);
                      setIsBookPickerOpen(false);
                    }}
                  />
                )}
              </div>
            </div>
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
                          {ReadingTimeUtil.formatDuration(item.seconds)}
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
