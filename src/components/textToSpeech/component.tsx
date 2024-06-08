import React from "react";
import { TextToSpeechProps, TextToSpeechState } from "./interface";
import { Trans } from "react-i18next";
import { speedList } from "../../constants/dropdownList";
import StorageUtil from "../../utils/serviceUtils/storageUtil";
import { sleep } from "../../utils/commonUtil";
import { isElectron } from "react-device-detect";
import toast from "react-hot-toast";
import RecordLocation from "../../utils/readUtils/recordLocation";
import BingTTSUtil from "../../utils/serviceUtils/bingTTSUtil";

class TextToSpeech extends React.Component<
  TextToSpeechProps,
  TextToSpeechState
> {
  nodeList: string[];
  voices: any;
  edgeVoices: any;
  nativeVoices: any;
  constructor(props: TextToSpeechProps) {
    super(props);
    this.state = {
      isSupported: false,
      isAudioOn: false,
    };
    this.nodeList = [];
    this.voices = [];
    this.edgeVoices = [];
    this.nativeVoices = [];
  }
  async componentDidMount() {
    if ("speechSynthesis" in window) {
      this.setState({ isSupported: true });
    }
    if (this.state.isAudioOn) {
      window.speechSynthesis && window.speechSynthesis.cancel();
      this.setState({ isAudioOn: false });
    }
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
    this.nativeVoices = await setSpeech();
    if (isElectron) {
      this.edgeVoices = await BingTTSUtil.getVoiceList();
      this.voices = [
        ...this.nativeVoices,
        ...this.edgeVoices.map((item) => {
          return {
            name:
              item.FriendlyName.split("-")[1].trim() +
              " " +
              item.Gender +
              " " +
              item.FriendlyName.split(" ")[1],
          };
        }),
      ];
    } else {
      this.voices = this.nativeVoices;
    }
  }
  handleChangeAudio = () => {
    if (this.state.isAudioOn) {
      window.speechSynthesis.cancel();
      BingTTSUtil.pauseAudio();
      this.setState({ isAudioOn: false });
    } else {
      this.handleStartSpeech();
    }
  };
  handleStartSpeech = () => {
    this.setState({ isAudioOn: true }, () => {
      this.handleAudio();
      this.handleSelect();
    });
  };
  handleSelect = () => {
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
        .children[StorageUtil.getReaderConfig("voiceIndex") || 0]?.setAttribute(
          "selected",
          "selected"
        );
    }
  };
  handleAudio = async () => {
    this.nodeList = await this.handleGetText();
    let voiceIndex = StorageUtil.getReaderConfig("voiceIndex") || 0;
    if (voiceIndex > this.nativeVoices.length) {
      await this.handleRead();
    } else {
      await this.handleSystemRead(0);
    }
  };
  handleGetText = async () => {
    if (StorageUtil.getReaderConfig("isSliding") === "yes") {
      await sleep(1000);
    }
    this.nodeList = this.props.htmlBook.rendition
      .audioText()
      .filter((item: string) => item && item.trim());
    if (this.nodeList.length === 0) {
      await this.props.htmlBook.rendition.next();
      this.nodeList = await this.handleGetText();
    }
    return this.nodeList;
  };
  async handleRead() {
    let voiceIndex = StorageUtil.getReaderConfig("voiceIndex") || 0;
    let speed = StorageUtil.getReaderConfig("voiceSpeed") || 1;

    BingTTSUtil.setAudioPaths();
    await BingTTSUtil.cacheAudio(
      [this.nodeList[0]],
      this.edgeVoices[voiceIndex - this.nativeVoices.length].ShortName,
      speed * 100 - 100
    );

    setTimeout(async () => {
      await BingTTSUtil.cacheAudio(
        this.nodeList.slice(1),
        this.edgeVoices[voiceIndex - this.nativeVoices.length].ShortName,
        speed * 100 - 100
      );
    }, 1);

    for (let index = 0; index < this.nodeList.length; index++) {
      let currentText = this.nodeList[index];
      let style = "background: #f3a6a68c";
      this.props.htmlBook.rendition.highlightNode(currentText, style);

      if (index > BingTTSUtil.getAudioPaths().length - 1) {
        while (true) {
          if (index < BingTTSUtil.getAudioPaths().length - 1) break;
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
      let res = await this.handleSpeech(
        index,
        StorageUtil.getReaderConfig("voiceIndex") || 0,
        StorageUtil.getReaderConfig("voiceSpeed") || 1
      );
      if (
        this.nodeList[index] ===
        this.props.htmlBook.rendition.visibleText()[
          this.props.htmlBook.rendition.visibleText().length - 1
        ]
      ) {
        await this.props.htmlBook.rendition.next();
      }
      if (res === "end") {
        break;
      }
    }
    if (this.state.isAudioOn && this.props.isReading) {
      isElectron &&
        (await window.require("electron").ipcRenderer.invoke("clear-tts"));
      let position = this.props.htmlBook.rendition.getPosition();
      RecordLocation.recordHtmlLocation(
        this.props.currentBook.key,
        position.text,
        position.chapterTitle,
        position.chapterDocIndex,
        position.chapterHref,
        position.count,
        position.percentage,
        position.cfi,
        position.page
      );
      this.nodeList = [];
      await this.handleAudio();
    }
  }
  async handleSystemRead(index) {
    let currentText = this.nodeList[index];
    let style = "background: #f3a6a68c";
    this.props.htmlBook.rendition.highlightNode(currentText, style);

    let res = await this.handleSystemSpeech(
      index,
      StorageUtil.getReaderConfig("voiceIndex") || 0,
      StorageUtil.getReaderConfig("voiceSpeed") || 1
    );

    if (res === "start") {
      index++;
      if (
        this.nodeList[index] ===
        this.props.htmlBook.rendition.visibleText()[
          this.props.htmlBook.rendition.visibleText().length - 1
        ]
      ) {
        await this.props.htmlBook.rendition.next();
      }
      if (
        this.state.isAudioOn &&
        this.props.isReading &&
        index === this.nodeList.length
      ) {
        let position = this.props.htmlBook.rendition.getPosition();
        RecordLocation.recordHtmlLocation(
          this.props.currentBook.key,
          position.text,
          position.chapterTitle,
          position.chapterDocIndex,
          position.chapterHref,
          position.count,
          position.percentage,
          position.cfi,
          position.page
        );
        this.nodeList = [];
        await this.handleAudio();
        return;
      }
      await this.handleSystemRead(index);
    } else if (res === "end") {
      return;
    }
  }
  handleSpeech = async (index: number, voiceIndex: number, speed: number) => {
    return new Promise<string>(async (resolve, reject) => {
      let res = await BingTTSUtil.readAloud(index);
      if (res === "loaderror") {
        resolve("start");
      } else {
        let player = BingTTSUtil.getPlayer();
        player.on("end", async () => {
          if (!(this.state.isAudioOn && this.props.isReading)) {
            resolve("end");
          }
          resolve("start");
        });
      }
    });
  };
  handleSystemSpeech = async (
    index: number,
    voiceIndex: number,
    speed: number
  ) => {
    return new Promise<string>(async (resolve, reject) => {
      var msg = new SpeechSynthesisUtterance();
      msg.text = this.nodeList[index]
        .replace(/\s\s/g, "")
        .replace(/\r/g, "")
        .replace(/\n/g, "")
        .replace(/\t/g, "")
        .replace(/&/g, "")
        .replace(/\f/g, "");

      msg.voice = this.nativeVoices[voiceIndex];
      msg.rate = speed;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(msg);
      msg.onerror = (err) => {
        console.log(err);
        resolve("end");
      };

      msg.onend = async (event) => {
        if (!(this.state.isAudioOn && this.props.isReading)) {
          resolve("end");
        }
        resolve("start");
      };
    });
  };
  render() {
    return (
      <>
        {
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
            {this.state.isAudioOn && this.voices.length > 0 && (
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
                    toast(this.props.t("Take effect in a while"));
                  }}
                >
                  {this.voices.map((item, index) => {
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
                    toast(this.props.t("Take effect in a while"));
                  }}
                >
                  {speedList.option.map((item) => (
                    <option
                      value={item}
                      className="lang-setting-option"
                      key={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        }
      </>
    );
  }
}

export default TextToSpeech;
