import React from "react";
import "./emptyCover.css";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import { getCoverTheme } from "../../utils/common";

const emptyCover = (props) => {
  const isEnableBookSpine =
    ConfigService.getReaderConfig("isEnableBookSpine") === "yes";
  return (
    <div
      className={
        "empty-cover" + (isEnableBookSpine ? " empty-cover-spine" : "")
      }
      style={{ transform: `scale(${props.scale})` }}
    >
      <div
        className="cover-banner"
        style={{
          backgroundColor: getCoverTheme(props.format),
        }}
      >
        {props.format || "BOOK"}
      </div>
      <div className="cover-title" style={{marginLeft:"8px"}}>{props.title}</div>
      <div className="cover-footer">Koodo Reader</div>
    </div>
  );
};

export default emptyCover;
