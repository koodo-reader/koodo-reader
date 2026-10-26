import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";
import "./speechDialog.css";
import TextToSpeech from "../../textToSpeech";

const SpeechDialog = () => {
  const { t } = useTranslation();
  const plugins = useAppStore((s) => s.manager.plugins);
  const handleSpeechDialog = useAppStore((s) => s.handleSpeechDialog);
  const handleFetchPlugins = useAppStore((s) => s.handleFetchPlugins);
  useEffect(() => {
    handleFetchPlugins();
  }, []);

  return (
    <div
      className="sort-dialog-container speech-dialog-container"
      onMouseEnter={() => {
        handleSpeechDialog(true);
      }}
      onMouseLeave={() => {
        handleSpeechDialog(false);
      }}
      style={{
        width: "280px",
        overflowY: "auto",
        maxHeight: "calc(100vh - 80px)",
      }}
    >
      <div className="speech-dialog-header">
        <span className="speech-dialog-title">{t("Text to speech")}</span>
        <span
          className="icon-close speech-dialog-close"
          onClick={() => {
            handleSpeechDialog(false);
          }}
        ></span>
      </div>
      {plugins && <TextToSpeech />}
    </div>
  );
};

export default SpeechDialog;
