import React from "react";
import "./emptyCover.css";

const emptyCover = (props) => {
  return (
    <div className="empty-cover" style={{ transform: `scale(${props.scale})` }}>
      <div
        className="cover-banner"
        style={{
          backgroundColor:
            props.format === "PDF"
              ? "rgba(55, 170, 81, 0.7)"
              : props.format === "TXT"
              ? "rgba(251, 191, 16)"
              : props.format === "EPUB"
              ? "rgba(33, 165, 241)"
              : props.format === "MOBI"
              ? "rgba(255, 108, 110)"
              : props.format === "AZW3"
              ? "rgba(55, 170, 81, 0.7)"
              : "rgba(255, 108, 110)",
        }}
      >
        {props.format || "BOOK"}
      </div>
      <div className="cover-title">{props.title}</div>
      <div className="cover-footer">Koodo Reader</div>
    </div>
  );
};
export default emptyCover;
