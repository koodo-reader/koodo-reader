import "./modeControl.css";
import { ModeControlProps } from "./interface";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { isPaginatedBook } from "../../../utils/common";
import { Trans } from "react-i18next";

const ModeControl = (props: ModeControlProps) => {
  const handleChangeMode = (mode: string) => {
    if (isPaginatedBook(props.currentBook)) {
      ConfigService.setReaderConfig("pdfReaderMode", mode);
    } else {
      ConfigService.setReaderConfig("readerMode", mode);
    }

    props.handleReaderMode(mode);
    props.renderBookFunc();
  };
  return (
    <div className="background-color-setting">
      <div
        className="background-color-text"
        style={{ position: "relative", bottom: "15px" }}
      >
        <Trans>View mode</Trans>
      </div>
      <div className="single-control-container">
        <div
          className="single-mode-container"
          onClick={() => {
            handleChangeMode("single");
          }}
          style={props.readerMode === "single" ? {} : { opacity: 0.4 }}
        >
          <span className="icon-single-page single-page-icon"></span>
        </div>

        <div
          className="double-mode-container"
          onClick={() => {
            handleChangeMode("double");
          }}
          style={props.readerMode === "double" ? {} : { opacity: 0.4 }}
        >
          <span className="icon-two-page two-page-icon"></span>
        </div>

        <div
          className="double-mode-container"
          onClick={() => {
            handleChangeMode("scroll");
          }}
          style={props.readerMode === "scroll" ? {} : { opacity: 0.4 }}
        >
          <span className="icon-scroll two-page-icon"></span>
        </div>
      </div>
    </div>
  );
};
export default ModeControl;
