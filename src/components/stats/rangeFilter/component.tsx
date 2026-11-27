import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ReadingTimeUtil } from "../../../assets/lib/kookit-extra-browser.min";
import { Preset, ReadingRange } from "../types";
import { formatDayLabel } from "../utils";
import "./rangeFilter.css";

const PRESETS: Preset[] = ["7d", "30d", "3m", "6m", "1y"];

const PRESET_SHORT_LABELS: Record<Preset, string> = {
  "7d": "7 Days",
  "30d": "30 Days",
  "3m": "3 Months",
  "6m": "6 Months",
  "1y": "1 Year",
};

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

interface RangeCalendarProps {
  range: ReadingRange;
  minKey: string;
  maxKey: string;
  onApply: (start: string, end: string) => void;
}

const RangeCalendar = ({
  range,
  minKey,
  maxKey,
  onApply,
}: RangeCalendarProps) => {
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

export interface RangeFilterProps {
  range: ReadingRange;
  minKey: string;
  maxKey: string;
  onPresetChange: (preset: Preset) => void;
  onApplyCustom: (start: string, end: string) => void;
}

const RangeFilter = ({
  range,
  minKey,
  maxKey,
  onPresetChange,
  onApplyCustom,
}: RangeFilterProps) => {
  const { t } = useTranslation();
  const pickerRef = useRef<HTMLDivElement>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

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

  return (
    <div className="stats-range-tabs">
      {PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          className={`stats-range-pill${
            range.preset === preset ? " is-active" : ""
          }`}
          onClick={() => onPresetChange(preset)}
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
          <RangeCalendar
            range={range}
            minKey={minKey}
            maxKey={maxKey}
            onApply={(start, end) => {
              onApplyCustom(start, end);
              setIsPickerOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default RangeFilter;
