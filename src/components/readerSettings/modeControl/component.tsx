import "./modeControl.css";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { isPaginatedBook } from "../../../utils/common";
import { Trans } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";

const ModeControl = () => {
  const renderBookFunc = useAppStore((s) => s.book.renderBookFunc);
  const readerMode = useAppStore((s) => s.reader.readerMode);
  const currentBook = useAppStore((s) => s.book.currentBook);
  const handleReaderMode = useAppStore((s) => s.handleReaderMode);
  const handleChangeMode = (mode: string) => {
    if (isPaginatedBook(currentBook)) {
      ConfigService.setReaderConfig("pdfReaderMode", mode);
    } else {
      ConfigService.setReaderConfig("readerMode", mode);
    }

    handleReaderMode(mode);
    renderBookFunc();
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
          style={readerMode === "single" ? {} : { opacity: 0.4 }}
        >
          <span className="icon-single-page single-page-icon"></span>
        </div>

        <div
          className="double-mode-container"
          onClick={() => {
            handleChangeMode("double");
          }}
          style={readerMode === "double" ? {} : { opacity: 0.4 }}
        >
          <span className="icon-two-page two-page-icon"></span>
        </div>

        <div
          className="double-mode-container"
          onClick={() => {
            handleChangeMode("scroll");
          }}
          style={readerMode === "scroll" ? {} : { opacity: 0.4 }}
        >
          <span className="icon-scroll two-page-icon"></span>
        </div>
      </div>
    </div>
  );
};
export default ModeControl;
