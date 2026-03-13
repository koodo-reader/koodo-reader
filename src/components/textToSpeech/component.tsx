import React from "react";
import { TextToSpeechProps, TextToSpeechState } from "./interface";
import { Trans } from "react-i18next";
import { speedList } from "../../constants/dropdownList";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import {
  getAllVoices,
  langToName,
  sleep,
  splitSentences,
} from "../../utils/common";
import { isElectron } from "react-device-detect";
import toast from "react-hot-toast";
import TTSUtil from "../../utils/reader/ttsUtil";
import "./textToSpeech.css";
import { fetchUserInfo } from "../../utils/request/user";
declare var window: any;
class TextToSpeech extends React.Component<
  TextToSpeechProps,
  TextToSpeechState
> {
  nodeList: string[];
  voices: any;
  customVoices: any;
  nativeVoices: any;
  voiceList: any;
  languageList: string[];
  constructor(props: TextToSpeechProps) {
    super(props);
    this.state = {
      isSupported: false,
      isAudioOn: false,
      voiceLocale:
        ConfigService.getReaderConfig("voiceLocale") || navigator.language,
    };
    this.nodeList = [];
    this.voices = [];
    this.customVoices = [];
    this.nativeVoices = [];
    this.voiceList = {};
    this.languageList = [];
  }
  async componentDidMount() {
    if ("speechSynthesis" in window) {
      this.setState({ isSupported: true });
    }
    window.speechSynthesis && window.speechSynthesis.cancel();
    this.setState({ isAudioOn: false });
    this.nodeList = [];
    const setSpeech = () => {
      return new Promise((resolve) => {
        let synth = window.speechSynthesis;
        let id;
        if (synth) {
          id = setInterval(() => {
            if (synth.getVoices().length !== 0) {
              resolve(
                synth.getVoices().map((item) => {
                  return {
                    ...item,
                    name: item.name,
                    displayName: item.name,
                    locale: item.lang,
                  };
                })
              );
              clearInterval(id);
            } else {
              this.setState({ isSupported: false });
            }
          }, 10);
        }
      });
    };
    this.nativeVoices = await setSpeech();
    if (isElectron) {
      this.customVoices = TTSUtil.getVoiceList(this.props.plugins);
      this.voices = [...this.nativeVoices, ...this.customVoices];
    } else {
      this.customVoices = getAllVoices(
        this.props.plugins.filter(
          (item) => item.key === "official-ai-voice-plugin"
        )
      );
      this.voices = [...this.nativeVoices, ...this.customVoices];
    }
    this.handleVoiceLocaleList();
    if (
      this.voices.length === 0 &&
      getAllVoices(this.props.plugins).length === 0
    ) {
      return;
    }
    if (this.voices.length > 0) {
      let voiceName = ConfigService.getReaderConfig("voiceName");
      let voiceEngine = ConfigService.getReaderConfig("voiceEngine");
      let voiceIndex = parseInt(ConfigService.getReaderConfig("voiceIndex"));

      if (
        !voiceName &&
        ConfigService.getReaderConfig("voiceIndex") &&
        !isNaN(voiceIndex)
      ) {
        ConfigService.setReaderConfig(
          "voiceName",
          this.voices[voiceIndex]
            ? this.voices[voiceIndex].name
            : this.voices[0].name
        );
      }
      if (!voiceEngine && voiceName) {
        let voice = this.voices.find((item) => item.name === voiceName);
        if (voice && voice.plugin) {
          ConfigService.setReaderConfig("voiceEngine", voice.plugin);
        } else {
          ConfigService.setReaderConfig("voiceEngine", "system");
        }
      }
      if (!voiceName && !voiceEngine && this.voices.length > 0) {
        ConfigService.setReaderConfig("voiceName", this.voices[0].name);
        ConfigService.setReaderConfig(
          "voiceEngine",
          this.voices[0].plugin || "system"
        );
      }
    }
  }
  UNSAFE_componentWillReceiveProps(
    nextProps: Readonly<TextToSpeechProps>,
    nextContext: any
  ): void {
    //plugin更新后重新获取语音列表
    if (nextProps.plugins !== this.props.plugins) {
      this.customVoices = TTSUtil.getVoiceList(nextProps.plugins);
      this.voices = [...this.nativeVoices, ...this.customVoices];
      this.handleVoiceLocaleList();
    }
  }
  handleChangeAudio = async () => {
    if (this.state.isAudioOn) {
      window.speechSynthesis && window.speechSynthesis.cancel();
      TTSUtil.pauseAudio();
      this.setState({ isAudioOn: false });
      this.nodeList = [];
    } else {
      if (
        ConfigService.getReaderConfig("voiceEngine") ===
          "official-ai-voice-plugin" &&
        this.props.isAuthed
      ) {
        toast.loading(this.props.t("Loading audio, please wait..."), {
          id: "tts-load",
        });
        await fetchUserInfo();
      }
      if (
        ConfigService.getReaderConfig("voiceEngine") ===
          "official-ai-voice-plugin" &&
        !this.props.isAuthed
      ) {
        ConfigService.setReaderConfig("voiceEngine", "system");
      }
      this.handleStartSpeech();
    }
  };
  handleStartSpeech = () => {
    this.setState({ isAudioOn: true }, () => {
      this.handleAudio();
    });
  };
  handleAudio = async () => {
    this.nodeList = await this.handleGetText();
    let voiceName = ConfigService.getReaderConfig("voiceName");
    if (
      voiceName &&
      this.customVoices.find((item) => item.name === voiceName)
    ) {
      await this.handleCustomRead(0);
    } else {
      await this.handleSystemRead(0);
    }
  };
  handleGetText = async () => {
    if (ConfigService.getReaderConfig("isSliding") === "yes") {
      await sleep(1000);
    }
    let nodeTextList = (await this.props.htmlBook.rendition.audioText()).filter(
      (item: string) => item && item.trim()
    );
    this.nodeList = nodeTextList;
    if (
      this.props.currentBook.format === "PDF" &&
      ConfigService.getReaderConfig("isConvertPDF") !== "yes"
    ) {
    } else {
      let rawNodeList = nodeTextList.map((text) => {
        return splitSentences(text);
      });

      this.nodeList = rawNodeList.flat();
    }
    if (this.nodeList.length === 0) {
      if (
        this.props.currentBook.format === "PDF" &&
        ConfigService.getReaderConfig("isConvertPDF") !== "yes"
      ) {
        let currentPosition = this.props.htmlBook.rendition.getPosition();
        await this.props.htmlBook.rendition.goToChapterIndex(
          parseInt(currentPosition.chapterDocIndex) +
            (this.props.readerMode === "double" ? 2 : 1)
        );
      } else {
        await this.props.htmlBook.rendition.next();
      }

      this.nodeList = await this.handleGetText();
    }
    return this.nodeList;
  };
  async handleCustomRead(nodeIndex: number) {
    let voiceName = ConfigService.getReaderConfig("voiceName");
    let voiceEngine = ConfigService.getReaderConfig("voiceEngine");
    let speed = parseFloat(ConfigService.getReaderConfig("voiceSpeed")) || 1;
    TTSUtil.setAudioPaths();
    for (let index = nodeIndex; index < this.nodeList.length; index++) {
      let currentText = this.nodeList[index];
      let style = "background: #f3a6a68c;";
      this.props.htmlBook.rendition.highlightAudioNode(currentText, style);
      if (index === nodeIndex) {
        let result = await TTSUtil.cacheAudio(
          index,
          voiceName,
          speed * 100 - 100,
          voiceEngine,
          this.props.plugins,
          this.nodeList,
          5,
          true
        );
        toast.dismiss("tts-load");
        if (result === "error") {
          toast.error(this.props.t("Audio loading failed, stopped playback"));
          this.setState({ isAudioOn: false });
          this.nodeList = [];
          return;
        }
      }
      if (ConfigService.getReaderConfig("voiceEngine") === "system") {
        await this.handleSystemRead(index);
        break;
      }

      TTSUtil.cacheAudio(
        index + 1,
        voiceName,
        speed * 100 - 100,
        voiceEngine,
        this.props.plugins,
        this.nodeList,
        10,
        false
      );
      let res = await this.handleSpeech(index);
      if (res === "error") {
        toast.error(this.props.t("Audio loading failed, stopped playback"));
        this.setState({ isAudioOn: false });
        this.nodeList = [];
        return;
      }
      let visibleTextList = await this.props.htmlBook.rendition.visibleText();
      let lastVisibleTextList = visibleTextList;
      if (
        this.props.currentBook.format === "PDF" &&
        ConfigService.getReaderConfig("isConvertPDF") !== "yes"
      ) {
      } else {
        let rawNodeList = visibleTextList.map((text) => {
          return splitSentences(text);
        });

        lastVisibleTextList = rawNodeList.flat();
      }

      if (
        this.nodeList[index] ===
        lastVisibleTextList[lastVisibleTextList.length - 1]
      ) {
        if (
          this.props.currentBook.format === "PDF" &&
          ConfigService.getReaderConfig("isConvertPDF") !== "yes"
        ) {
          let currentPosition = this.props.htmlBook.rendition.getPosition();
          await this.props.htmlBook.rendition.goToChapterIndex(
            parseInt(currentPosition.chapterDocIndex) +
              (this.props.readerMode === "double" ? 2 : 1)
          );
        } else {
          await this.props.htmlBook.rendition.next();
        }
      }
      if (res === "end") {
        break;
      }
    }
    if (this.state.isAudioOn && this.props.isReading) {
      await TTSUtil.clearAudioPaths();
      let position = this.props.htmlBook.rendition.getPosition();
      ConfigService.setObjectConfig(
        this.props.currentBook.key,
        position,
        "recordLocation"
      );
      this.nodeList = [];
      await this.handleAudio();
    }
  }
  async handleSystemRead(index) {
    if (index >= this.nodeList.length) {
      this.nodeList = [];
      await this.handleAudio();
      return;
    }
    let currentText = this.nodeList[index];
    let style = "background: #f3a6a68c;";
    this.props.htmlBook.rendition.highlightAudioNode(currentText, style);

    let res = await this.handleSystemSpeech(
      index,
      ConfigService.getReaderConfig("voiceName"),
      parseFloat(ConfigService.getReaderConfig("voiceSpeed")) || 1
    );

    if (res === "start") {
      let visibleTextList = await this.props.htmlBook.rendition.visibleText();
      let lastVisibleTextList = visibleTextList;
      if (
        this.props.currentBook.format === "PDF" &&
        ConfigService.getReaderConfig("isConvertPDF") !== "yes"
      ) {
      } else {
        let rawNodeList = visibleTextList.map((text) => {
          return splitSentences(text);
        });

        lastVisibleTextList = rawNodeList.flat();
      }
      if (
        this.nodeList[index] ===
        lastVisibleTextList[lastVisibleTextList.length - 1]
      ) {
        if (
          this.props.currentBook.format === "PDF" &&
          ConfigService.getReaderConfig("isConvertPDF") !== "yes"
        ) {
          let currentPosition = this.props.htmlBook.rendition.getPosition();
          await this.props.htmlBook.rendition.goToChapterIndex(
            parseInt(currentPosition.chapterDocIndex) +
              (this.props.readerMode === "double" ? 2 : 1)
          );
        } else {
          await this.props.htmlBook.rendition.next();
        }
      }
      if (
        this.state.isAudioOn &&
        this.props.isReading &&
        index === this.nodeList.length
      ) {
        let position = this.props.htmlBook.rendition.getPosition();
        ConfigService.setObjectConfig(
          this.props.currentBook.key,
          position,
          "recordLocation"
        );
        this.nodeList = [];
        await this.handleAudio();
        return;
      }
      index++;
      if (ConfigService.getReaderConfig("voiceEngine") !== "system") {
        await this.handleCustomRead(index);
      } else {
        await this.handleSystemRead(index);
      }
    } else if (res === "end") {
      return;
    }
  }
  handleSpeech = async (index: number) => {
    return new Promise<string>(async (resolve) => {
      let res = await TTSUtil.readAloud(index);
      if (res === "loaderror") {
        resolve("error");
      } else {
        let player = TTSUtil.getPlayer();
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
    voiceName: string,
    speed: number
  ) => {
    return new Promise<string>(async (resolve) => {
      var msg = new SpeechSynthesisUtterance();
      msg.text = this.nodeList[index]
        .replace(/\s\s/g, "")
        .replace(/\r/g, "")
        .replace(/\n/g, "")
        .replace(/\t/g, "")
        .replace(/&/g, "")
        .replace(/\f/g, "");
      if (!voiceName) {
        voiceName = this.nativeVoices[0]?.name;
      }
      msg.voice = this.nativeVoices.find(
        (voice: any) => voice.name === voiceName
      );
      msg.rate = speed;
      window.speechSynthesis && window.speechSynthesis.cancel();
      window.speechSynthesis.speak(msg);
      msg.onerror = (err) => {
        console.error(err);
        resolve("end");
      };

      msg.onend = async () => {
        if (!(this.state.isAudioOn && this.props.isReading)) {
          resolve("end");
        }
        resolve("start");
      };
    });
  };
  handleVoiceLocaleList = () => {
    let voiceList = {};
    let totalVoiceList = this.voices;
    totalVoiceList.forEach((voice) => {
      if (!voiceList[voice.locale]) {
        voiceList[voice.locale] = [];
      }
      voiceList[voice.locale].push(voice);
    });
    this.voiceList = voiceList;
    let languageList: string[] = [];
    for (let voice of totalVoiceList) {
      if (!languageList.includes(voice.locale)) {
        languageList.push(voice.locale);
      }
    }
    languageList = languageList
      .map((lang, index) => ({ lang, index }))
      .sort((a, b) => {
        let lang = navigator.language || "en-US";
        let langCode = lang.split("-")[0];
        const aMatch = a.lang.startsWith(langCode);
        const bMatch = b.lang.startsWith(langCode);
        if (aMatch && bMatch) return a.index - b.index;
        if (aMatch) return -1;
        if (bMatch) return 1;
        return a.lang.localeCompare(b.lang);
      })
      .map((item) => item.lang);
    console.log(this.voiceList, this.languageList);
    this.languageList = languageList;
  };
  render() {
    return (
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
        <div
          className="setting-dialog-new-title"
          style={{
            marginLeft: "20px",
            width: "88%",
            marginTop: "20px",
            fontWeight: 500,
          }}
        >
          <Trans>Language</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            id="text-speech-locale"
            onChange={(event) => {
              ConfigService.setReaderConfig("voiceLocale", event.target.value);
              this.setState({ voiceLocale: event.target.value });
            }}
          >
            {this.languageList.map((item) => {
              return (
                <option
                  value={item}
                  key={item}
                  className="lang-setting-option"
                  selected={
                    item === ConfigService.getReaderConfig("voiceLocale")
                  }
                >
                  {langToName(item)}
                </option>
              );
            })}
          </select>
        </div>
        <div
          className="setting-dialog-new-title"
          style={{
            marginLeft: "20px",
            width: "88%",
            fontWeight: 500,
          }}
        >
          <Trans>Voice</Trans>
          <select
            name=""
            className="lang-setting-dropdown"
            id="text-speech-voice"
            onChange={(event) => {
              ConfigService.setReaderConfig("voiceName", event.target.value);
              let voice = this.voices.find(
                (item) => item.name === event.target.value
              );
              if (!voice) {
                return;
              }
              if (voice.plugin) {
                ConfigService.setReaderConfig("voiceEngine", voice.plugin);
              } else {
                ConfigService.setReaderConfig("voiceEngine", "system");
              }

              if (this.state.isAudioOn) {
                toast(this.props.t("Take effect in a while"));
              }
            }}
          >
            {(this.voiceList[this.state.voiceLocale] || this.voices).map(
              (item) => {
                return (
                  <option
                    value={item.name}
                    key={item.name}
                    className="lang-setting-option"
                    selected={
                      item.name === ConfigService.getReaderConfig("voiceName")
                    }
                  >
                    {this.props.t(item.displayName || item.name)}
                  </option>
                );
              }
            )}
          </select>
        </div>

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
              ConfigService.setReaderConfig("voiceSpeed", event.target.value);
              if (this.state.isAudioOn) {
                toast(this.props.t("Take effect in a while"));
              }
            }}
          >
            {speedList.option.map((item) => (
              <option
                value={item.value}
                className="lang-setting-option"
                key={item.value}
                selected={
                  item.value ===
                  (ConfigService.getReaderConfig("voiceSpeed") || "1")
                }
              >
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <span
            style={{
              textDecoration: "underline",
              cursor: "pointer",
              textAlign: "center",
            }}
            onClick={() => {
              this.props.handleSetting(true);
              this.props.handleSettingMode("plugins");
            }}
          >
            <Trans>Add new voice</Trans>
          </span>
        </div>
      </>
    );
  }
}

export default TextToSpeech;
