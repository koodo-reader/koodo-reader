import React from "react";
import { SpeechDialogProps, SpeechDialogState } from "./interface";
import "./speechDialog.css";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import TextToSpeech from "../../textToSpeech";

class SpeechDialog extends React.Component<
  SpeechDialogProps,
  SpeechDialogState
> {
  constructor(props: SpeechDialogProps) {
    super(props);
    this.state = {
      isShowExportAll: false,
      isConvertPDF: ConfigService.getReaderConfig("isConvertPDF") === "yes",
    };
  }
  componentDidMount(): void {
    this.props.handleFetchPlugins();
  }
  render() {
    return (
      <>
        <div
          className="sort-dialog-container"
          onMouseEnter={() => {
            this.props.handleSpeechDialog(true);
          }}
          style={{
            left: "auto",
            top: "auto",
            bottom: "60px",
            width: "300px",
            height: "320px",
            overflowY: "scroll",
            right: this.props.isSettingLocked ? 370 : 65,
          }}
        >
          {this.props.plugins && <TextToSpeech />}
        </div>
      </>
    );
  }
}

export default SpeechDialog;
