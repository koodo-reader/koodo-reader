import React from "react";
import "./emptyCover.css";

const emptyCover = (props) => (
  <div className="empty-cover" style={{ transform: `scale(${props.scale})` }}>
    <div
      className="cover-banner"
      style={{
        backgroundColor:
          props.format === "PDF"
            ? "rgba(55, 170, 81, 0.7)"
            : props.format === "TXT"
              ? "rgba(251, 191, 16,1)"
              : props.format === "EPUB"
                ? "rgba(33, 165, 241,1)"
                : props.format === "MOBI"
                  ? "rgba(255, 108, 110,1)"
                  : props.format === "AZW3" || props.format === "AZW"
                    ? " #ff9900"
                    : props.format === "MD"
                      ? "#5e7fff"
                      : props.format === "FB2"
                        ? "#0063b1"
                        : props.format === "CHM"
                          ? "#8e6fce"
                          : props.format === "DOCX" ||
                              props.format === "DOC"
                            ? " #118CD9"
                            : props.format === "RTF"
                              ? "#0F766E"
                              : props.format === "CBT" ||
                                props.format === "CBZ" ||
                                props.format === "CB7" ||
                                props.format === "CBR"
                              ? "#00b6c2"
                              : props.format === "PPTX" ||
                                  props.format === "PPT"
                                ? "#C43E1C"
                                : props.format === "XPS" ||
                                    props.format === "OXPS"
                                  ? "#744DA9"
                                  : props.format === "DJVU" ||
                                      props.format === "DJV"
                                    ? "#003366"
                                    : props.format === "OFD"
                                      ? "#C2185B"
                                      : "#118CD9",
      }}
    >
      {props.format || "BOOK"}
    </div>
    <div className="cover-title">{props.title}</div>
    <div className="cover-footer">Koodo Reader</div>
  </div>
);

export default emptyCover;
