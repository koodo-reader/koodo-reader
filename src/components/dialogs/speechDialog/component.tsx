import { useEffect } from "react";
import { useAppStore } from "../../../store/useAppStore";
import "./speechDialog.css";
import TextToSpeech from "../../textToSpeech";

const SpeechDialog = () => {
  const plugins = useAppStore((s) => s.manager.plugins);
  const isSettingLocked = useAppStore((s) => s.reader.isSettingLocked);
  const isDockedRight = useAppStore((s) => s.reader.isDockedRight);
  const handleSpeechDialog = useAppStore((s) => s.handleSpeechDialog);
  const handleFetchPlugins = useAppStore((s) => s.handleFetchPlugins);
  useEffect(() => {
    handleFetchPlugins();
  }, []);

  return (
    <>
      <div
        className="sort-dialog-container"
        onMouseEnter={() => {
          handleSpeechDialog(true);
        }}
        style={{
          left: "auto",
          top: "auto",
          bottom: "60px",
          width: "300px",
          height: "340px",
          overflowY: "scroll",
          right: isSettingLocked || isDockedRight ? 370 : 65,
        }}
      >
        <div className="speech-dialog-header">
          <span className="speech-dialog-title"></span>
          <span
            className="icon-close speech-dialog-close"
            onClick={() => {
              handleSpeechDialog(false);
            }}
          ></span>
        </div>
        {plugins && <TextToSpeech />}
      </div>
    </>
  );
};

export default SpeechDialog;
