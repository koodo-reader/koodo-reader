import React from "react";
import "./bookCoverFrame.css";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";

export interface BookCoverFrameProps {
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const BookCoverFrame: React.FC<BookCoverFrameProps> = ({ style, children }) => {
  const isEnableBookSpine =
    ConfigService.getReaderConfig("isEnableBookSpine") === "yes";
  return (
    <div
      className={
        "book-cover-frame" +
        (isEnableBookSpine ? " book-cover-frame-spine" : "")
      }
      style={style}
    >
      {children}
    </div>
  );
};

export default BookCoverFrame;
