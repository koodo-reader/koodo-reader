import React from "react";
import "./emptyCover.css";
import { getCoverTheme } from "../../utils/common";

const emptyCover = (props) => (
  <div className="empty-cover" style={{ transform: `scale(${props.scale})` }}>
    <div
      className="cover-banner"
      style={{
        backgroundColor: getCoverTheme(props.format),
      }}
    >
      {props.format || "BOOK"}
    </div>
    <div className="cover-title">{props.title}</div>
    <div className="cover-footer">Koodo Reader</div>
  </div>
);

export default emptyCover;
