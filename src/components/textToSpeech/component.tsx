import React from "react";
import { TextToSpeechProps, TextToSpeechState } from "./interface";
import { Trans } from "react-i18next";
import { speedList } from "../../constants/dropdownList";
import StorageUtil from "../../utils/serviceUtils/storageUtil";
import { sleep } from "../../utils/commonUtil";
import EdgeUtil from "../../utils/serviceUtils/edgeUtil";

class TextToSpeech extends React.Component<
  TextToSpeechProps,
  TextToSpeechState
> {
  constructor(props: TextToSpeechProps) {
    super(props);
    this.state = {
      isSupported: false,
      isAudioOn: false,
      voices: [],
      edgeVoices: [],
      nativeVoices: [],
      nodeIndex: 0,
      nodeList: [],
    };
  }
  async componentDidMount() {
    if ("speechSynthesis" in window) {
      this.setState({ isSupported: true });
    }
    if (this.state.isAudioOn) {
      window.speechSynthesis && window.speechSynthesis.cancel();
      this.setState({ isAudioOn: false });
    }
    let synth = window.speechSynthesis;
    synth.getVoices();
    this.setState({ edgeVoices: await EdgeUtil.getVoiceList() });
  }
  handleChangeAudio = () => {
    if (this.state.isAudioOn) {
      window.speechSynthesis.cancel();
      EdgeUtil.pauseAudio();
      this.setState({ isAudioOn: false });
    } else {
      const setSpeech = () => {
        return new Promise((resolve, reject) => {
          let synth = window.speechSynthesis;
          let id;

          id = setInterval(() => {
            if (synth.getVoices().length !== 0) {
              resolve(synth.getVoices());
              clearInterval(id);
            } else {
              this.setState({ isSupported: false });
            }
          }, 10);
        });
      };

      let s = setSpeech();
      s.then(async (voices: any) => {
        this.setState({ nativeVoices: voices });
        this.setState(
          {
            voices: [
              ...voices,
              ...this.state.edgeVoices.map((item) => {
                return {
                  name:
                    item.FriendlyName.split("-")[1].trim() +
                    " " +
                    item.Gender +
                    " " +
                    item.FriendlyName.split(" ")[1],
                };
              }),
            ],
          },
          () => {
            this.setState({ isAudioOn: true }, () => {
              this.handleAudio();
              if (
                document.querySelector("#text-speech-speed") &&
                document.querySelector("#text-speech-voice") &&
                document.querySelector("#text-speech-speed")!.children[0] &&
                document.querySelector("#text-speech-voice")!.children[0]
              ) {
                document
                  .querySelector("#text-speech-speed")!
                  .children[
                    speedList.option.indexOf(
                      StorageUtil.getReaderConfig("voiceSpeed") || "1"
                    )
                  ]?.setAttribute("selected", "selected");
                document
                  .querySelector("#text-speech-voice")!
                  .children[
                    StorageUtil.getReaderConfig("voiceIndex") || 0
                  ]?.setAttribute("selected", "selected");
              }
            });
          }
        );
      });
    }
  };
  handleAudio = async () => {
    if (StorageUtil.getReaderConfig("isSliding") === "yes") {
      await sleep(1000);
    }
    if (this.state.nodeIndex === 0) {
      this.setState(
        { nodeList: this.props.htmlBook.rendition.visibleText() },
        async () => {
          await this.handleRead();
        }
      );
    } else if (this.state.nodeIndex === this.state.nodeList.length) {
      await this.props.htmlBook.rendition.next();
      this.setState({ nodeIndex: 0 }, async () => {
        await this.handleAudio();
      });
    } else {
      await this.handleRead();
    }
  };
  async handleRead() {
    let text = this.state.nodeList[this.state.nodeIndex];
    let style =
      "background: " +
      (StorageUtil.getReaderConfig("backgroundColor") || "#f3a6a68c");
    this.props.htmlBook.rendition.highlightNode(text, style);
    text = text
      .replace(/\s\s/g, "")
      .replace(/\r/g, "")
      .replace(/\n/g, "")
      .replace(/\t/g, "")
      .replace(/\f/g, "");
    await this.handleSpeech(
      text,
      StorageUtil.getReaderConfig("voiceIndex") || 0,
      StorageUtil.getReaderConfig("voiceSpeed") || 1
    );
    this.setState({ nodeIndex: this.state.nodeIndex + 1 });
  }
  handleSpeech = async (text: string, voiceIndex: number, speed: number) => {
    if (voiceIndex > this.state.nativeVoices.length) {
      let edgeVoice =
        this.state.edgeVoices[voiceIndex - this.state.nativeVoices.length];
      await EdgeUtil.readAloud(text, edgeVoice.ShortName);
      let player = EdgeUtil.getPlayer();

      player.onended = async (event) => {
        if (!(this.state.isAudioOn && this.props.isReading)) {
          return;
        }
        // await this.props.htmlBook.rendition.next();
        await this.handleAudio();
      };
    } else {
      var msg = new SpeechSynthesisUtterance();
      msg.text = text;
      msg.voice = window.speechSynthesis.getVoices()[voiceIndex];
      msg.rate = speed;
      window.speechSynthesis.speak(msg);
      msg.onerror = (err) => {
        console.log(err);
      };

      msg.onend = async (event) => {
        if (!(this.state.isAudioOn && this.props.isReading)) {
          return;
        }
        await this.handleAudio();
      };
    }
  };

  render() {
    return (
      <>
        {this.state.isSupported ? (
          <>
            <div className="single-control-switch-container">
              <span className="single-control-switch-title">
                <Trans>Turn on text-to-speech</Trans>
              </span>

              <span
                className="single-control-switch"
                onClick={() => {
                  this.handleChangeAudio();
                }}
                style={this.state.isAudioOn ? {} : { opacity: 0.6 }}
              >
                <span
                  className="single-control-button"
                  style={
                    this.state.isAudioOn
                      ? {
                          transform: "translateX(20px)",
                          transition: "transform 0.5s ease",
                        }
                      : {
                          transform: "translateX(0px)",
                          transition: "transform 0.5s ease",
                        }
                  }
                ></span>
              </span>
            </div>
            {this.state.isAudioOn && this.state.voices.length > 0 && (
              <div
                className="setting-dialog-new-title"
                style={{
                  marginLeft: "20px",
                  width: "88%",
                  marginTop: "20px",
                  fontWeight: 500,
                }}
              >
                <Trans>Voice</Trans>
                <select
                  name=""
                  className="lang-setting-dropdown"
                  id="text-speech-voice"
                  onChange={(event) => {
                    StorageUtil.setReaderConfig(
                      "voiceIndex",
                      event.target.value
                    );
                    window.speechSynthesis.cancel();
                  }}
                >
                  {this.state.voices.map((item, index) => {
                    return (
                      <option
                        value={index}
                        key={item.name}
                        className="lang-setting-option"
                      >
                        {item.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
            {this.state.isAudioOn && (
              <div
                className="setting-dialog-new-title"
                style={{ marginLeft: "20px", width: "88%", fontWeight: 500 }}
              >
                <Trans>Speed</Trans>
                <select
                  name=""
                  id="text-speech-speed"
                  className="lang-setting-dropdown"
                  onChange={(event) => {
                    StorageUtil.setReaderConfig(
                      "voiceSpeed",
                      event.target.value
                    );
                    window.speechSynthesis.cancel();
                  }}
                >
                  {speedList.option.map((item) => (
                    <option value={item} className="lang-setting-option">
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        ) : null}
      </>
    );
  }
}

export default TextToSpeech;
