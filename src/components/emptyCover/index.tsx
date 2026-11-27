import React from "react";
import "./emptyCover.css";
import { useTranslation } from "react-i18next";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { coverColors, getCoverTheme } from "../../constants/coverTheme";
import coverArt from "../../assets/images/cover.png";

export interface EmptyCoverProps {
  format?: string;
  title: string;
  author?: string;
  scale?: number;
}

const EmptyCover: React.FC<EmptyCoverProps> = (props) => {
  const { format, title, author, scale = 1 } = props;
  const { t } = useTranslation();
  const isEnableBookSpine =
    ConfigService.getReaderConfig("isEnableBookSpine") === "yes";
  const theme = coverColors[getCoverTheme(format)];
  // Below this scale the author line is only a few pixels tall, so drop it.
  const isShowAuthorLine = scale >= 0.6;
  return (
    <div
      className={
        "empty-cover" + (isEnableBookSpine ? " empty-cover-spine" : "")
      }
      style={{
        transform: `scale(${scale})`,
        backgroundColor: theme.backgroundColor,
        color: theme.color,
      }}
    >
      <div className="empty-cover-art" aria-hidden="true">
        <img src={coverArt} alt="" draggable={false} />
      </div>
      <div className="empty-cover-title">
        <span>{title}</span>
      </div>
      {isShowAuthorLine && (
        <>
          <div className="empty-cover-divider" />
          <div className="empty-cover-author">
            {author || t("Unknown author")}
          </div>
        </>
      )}
    </div>
  );
};

export default EmptyCover;
