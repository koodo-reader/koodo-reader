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
  constructor(props: TextToSpeechProps) {
    super(props);
    this.state = {
      isSupported: false,
      isAudioOn: false,
      isPaused: false,
      currentIndex: 0,
      languageList: [],
      voiceList: {},
      voiceLocale:
        ConfigService.getReaderConfig("voiceLocale") || navigator.language,
    };
    this.nodeList = [];
    this.voices = [];
    this.customVoices = [];
    this.nativeVoices = [];
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
              let voices = synth.getVoices();
              resolve(
                voices.map((item) => {
                  item.displayName = item.name;
                  item.locale = item.lang;
                  return item;
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
  handleStartAudio = async () => {
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
  };
  handlePauseAudio = async () => {
    window.speechSynthesis && window.speechSynthesis.cancel();
    await TTSUtil.pauseAudio();
    this.setState({ isPaused: true });
  };
  handleStop = async () => {
    window.speechSynthesis && window.speechSynthesis.cancel();
    await TTSUtil.stopAudio();
    this.setState({ isAudioOn: false, isPaused: false, currentIndex: 0 });
    this.nodeList = [];
  };
  handlePauseResume = () => {
    // Resume from current index
    this.setState({ isPaused: false }, () => {
      let voiceName = ConfigService.getReaderConfig("voiceName");
      if (
        voiceName &&
        this.customVoices.find((item) => item.name === voiceName)
      ) {
        this.handleCustomRead(this.state.currentIndex);
      } else {
        this.handleSystemRead(this.state.currentIndex);
      }
    });
  };
  handlePrevSentence = async () => {
    if (!this.state.isAudioOn || this.nodeList.length === 0) return;
    let prevIndex = Math.max(0, this.state.currentIndex - 1);
    window.speechSynthesis && window.speechSynthesis.cancel();
    await TTSUtil.pauseAudio();
    this.setState({ currentIndex: prevIndex, isPaused: false }, () => {
      let voiceName = ConfigService.getReaderConfig("voiceName");
      if (
        voiceName &&
        this.customVoices.find((item) => item.name === voiceName)
      ) {
        this.handleCustomRead(prevIndex);
      } else {
        this.handleSystemRead(prevIndex);
      }
    });
  };
  handleNextSentence = async () => {
    if (!this.state.isAudioOn || this.nodeList.length === 0) return;
    let nextIndex = this.state.currentIndex + 1;
    window.speechSynthesis && window.speechSynthesis.cancel();
    await TTSUtil.pauseAudio();
    if (nextIndex >= this.nodeList.length) {
      // Move to next page
      this.setState({ currentIndex: 0, isPaused: false }, async () => {
        this.nodeList = [];
        await this.handleAudio();
      });
    } else {
      this.setState({ currentIndex: nextIndex, isPaused: false }, () => {
        let voiceName = ConfigService.getReaderConfig("voiceName");
        if (
          voiceName &&
          this.customVoices.find((item) => item.name === voiceName)
        ) {
          this.handleCustomRead(nextIndex);
        } else {
          this.handleSystemRead(nextIndex);
        }
      });
    }
  };
  handleStartSpeech = () => {
    this.setState({ isAudioOn: true, isPaused: false, currentIndex: 0 }, () => {
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
    if (!this.state.isAudioOn) {
      TTSUtil.setAudioPaths();
    }

    for (let index = nodeIndex; index < this.nodeList.length; index++) {
      if (this.state.isPaused || !this.state.isAudioOn) return;
      this.setState({ currentIndex: index });
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
      if (this.state.isPaused || !this.state.isAudioOn) return;
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
      TTSUtil.setAudioPaths();
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
    if (this.state.isPaused || !this.state.isAudioOn) return;
    if (index >= this.nodeList.length) {
      this.nodeList = [];
      await this.handleAudio();
      return;
    }
    this.setState({ currentIndex: index });
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
    this.setState({ languageList, voiceList });
  };
  render() {
    return (
      <>
        <div className="tts-player-container">
          <div className="tts-player-controls">
            <span
              className="tts-player-btn"
              title={this.props.t("Stop")}
              onClick={() => this.handleStop()}
              style={
                !this.state.isAudioOn
                  ? { opacity: 0.3, cursor: "not-allowed" }
                  : {}
              }
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M6 6h12v12H6z" />
              </svg>
            </span>
            <span
              className="tts-player-btn"
              title={this.props.t("Previous")}
              onClick={() => this.handlePrevSentence()}
              style={
                !this.state.isAudioOn
                  ? { opacity: 0.3, cursor: "not-allowed" }
                  : {}
              }
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="currentColor"
              >
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </span>
            <span
              className="tts-player-btn tts-player-btn-main"
              title={
                !this.state.isAudioOn
                  ? this.props.t("Play")
                  : this.state.isPaused
                    ? this.props.t("Resume")
                    : this.props.t("Pause")
              }
              onClick={() => {
                if (!this.state.isAudioOn && !this.state.isPaused) {
                  this.handleStartAudio();
                } else if (!this.state.isPaused) {
                  this.handlePauseAudio();
                } else {
                  this.handlePauseResume();
                }
              }}
            >
              {!this.state.isAudioOn || this.state.isPaused ? (
                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  fill="currentColor"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </span>
            <span
              className="tts-player-btn"
              title={this.props.t("Next")}
              onClick={() => this.handleNextSentence()}
              style={
                !this.state.isAudioOn
                  ? { opacity: 0.3, cursor: "not-allowed" }
                  : {}
              }
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="currentColor"
              >
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </span>
            <span
              className="tts-player-btn"
              title={this.props.t("Stop")}
              onClick={() => this.handleStop()}
              style={
                !this.state.isAudioOn
                  ? { opacity: 0.3, cursor: "not-allowed" }
                  : {}
              }
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M6 6h12v12H6z" />
              </svg>
            </span>
          </div>
          {this.state.isAudioOn && this.nodeList.length > 0 && (
            <div className="tts-player-info">
              {this.state.currentIndex + 1} / {this.nodeList.length}
            </div>
          )}
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
            {this.state.languageList.map((item) => {
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
              let selectedValue = event.target.value;
              let [voiceName, plugin] = selectedValue.split("#");
              ConfigService.setReaderConfig("voiceName", voiceName);
              let voice = this.voices.find(
                (item) => item.name === voiceName && item.plugin === plugin
              );
              if (!voice) {
                return;
              }
              if (voice.plugin) {
                ConfigService.setReaderConfig("voiceEngine", voice.plugin);
              } else {
                ConfigService.setReaderConfig("voiceEngine", "system");
              }
              if (
                voice.plugin === "official-ai-voice-plugin" &&
                event.target.value.indexOf("Neural") > -1
              ) {
                toast(
                  this.props.t(
                    "Due to the high cost of Azure TTS voices, this voice will consume 5 times of your daily quota than normal voice"
                  ),
                  {
                    duration: 8000,
                    id: "costWarning",
                  }
                );
              }

              if (this.state.isAudioOn) {
                toast(this.props.t("Take effect in a while"));
              }
            }}
          >
            {(this.state.voiceList[this.state.voiceLocale] || this.voices).map(
              (item) => {
                return (
                  <option
                    value={[item.name, item.plugin].join("#")}
                    key={[item.name, item.plugin].join("#")}
                    className="lang-setting-option"
                    selected={
                      item.name ===
                        ConfigService.getReaderConfig("voiceName") &&
                      item.plugin ===
                        ConfigService.getReaderConfig("voiceEngine")
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
