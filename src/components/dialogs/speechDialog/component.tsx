import { useEffect } from "react";
import { SpeechDialogProps } from "./interface";
import "./speechDialog.css";
import TextToSpeech from "../../textToSpeech";

const SpeechDialog = (props: SpeechDialogProps) => {
  useEffect(() => {
    props.handleFetchPlugins();
  }, []);

  return (
    <>
      <div
        className="sort-dialog-container"
        onMouseEnter={() => {
          props.handleSpeechDialog(true);
        }}
        style={{
          left: "auto",
          top: "auto",
          bottom: "60px",
          width: "300px",
          height: "340px",
          overflowY: "scroll",
          right: props.isSettingLocked || props.isDockedRight ? 370 : 65,
        }}
      >
        <div className="speech-dialog-header">
          <span className="speech-dialog-title"></span>
          <span
            className="icon-close speech-dialog-close"
            onClick={() => {
              props.handleSpeechDialog(false);
            }}
          ></span>
        </div>
        {props.plugins && <TextToSpeech />}
      </div>
    </>
  );
};

export default SpeechDialog;
