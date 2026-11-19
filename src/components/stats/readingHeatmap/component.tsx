import { Trans, useTranslation } from "react-i18next";
import { ReadingTimeUtil } from "../../../assets/lib/kookit-extra-browser.min";
import "./readingHeatmap.css";

const getHeatmapColor = (seconds: number, isDarkMode: boolean): string => {
  if (seconds === 0)
    return isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  if (seconds < 300) return isDarkMode ? "#0e4429" : "#9be9a8";
  if (seconds < 900) return isDarkMode ? "#006d32" : "#40c463";
  if (seconds < 1800) return isDarkMode ? "#26a641" : "#30a14e";
  return isDarkMode ? "#39d353" : "#216e39";
};

interface ReadingDay {
  date: string;
  seconds: number;
}

export interface ReadingHeatmapProps {
  data: ReadingDay[];
  darkMode: boolean;
  cardBg: string;
}

const ReadingHeatmap = ({ data, darkMode, cardBg }: ReadingHeatmapProps) => {
  const { i18n } = useTranslation();

  // Build week columns: each column is 7 days (Sun–Sat)
  const padded: (ReadingDay | null)[] = [
    ...data,
    ...Array((7 - (data.length % 7 || 7)) % 7).fill(null),
  ];

  // Split into columns of 7
  const weeks: (ReadingDay | null)[][] = [];
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

  const weekdayLabels = ReadingTimeUtil.getWeekdayLabels(i18n.language, "short");
  const weekDays = weekdayLabels.map((label, index) =>
    index % 2 === 1 ? label : ""
  );
  const legendLevels = [0, 200, 600, 1200, 2400];

  return (
    <div
      className="stats-heatmap-wrapper"
      style={{ backgroundColor: cardBg }}
    >
      <div className="stats-section-title">
        <Trans>Reading Activity</Trans>
      </div>
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
                        backgroundColor: getHeatmapColor(cell.seconds, darkMode),
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

export default ReadingHeatmap;
