import React from "react";
import { TextToSpeechProps, TextToSpeechState } from "./interface";
import { Trans } from "react-i18next";
import { speedList } from "../../constants/dropdownList";
import {
  ConfigService,
  KookitConfig,
} from "../../assets/lib/kookit-extra-browser.min";
import {
  getAllVoices,
  getFormatFromAudioPath,
  langToName,
  sleep,
  splitSentences,
} from "../../utils/common";
import { isElectron } from "react-device-detect";
import toast from "react-hot-toast";
import TTSUtil from "../../utils/reader/ttsUtil";
import "./textToSpeech.css";
import { fetchUserInfo } from "../../utils/request/user";
import { getSplitSentence } from "../../utils/request/reader";
import { Howl } from "howler";
declare var window: any;
class TextToSpeech extends React.Component<
  TextToSpeechProps,
  TextToSpeechState
> {
  nodeList: {
    text: string;
    voiceName: string;
    voiceEngine: string;
  }[];
  customVoices: any;
  voices: any;
  nativeVoices: any;
  previewPlayer: Howl | null;
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
      multiRoleEnabled: ConfigService.getAllListConfig(
        "multiRoleVoiceBooks"
      ).includes(props.currentBook?.key),
      multiRoleVoiceType:
        ConfigService.getReaderConfig("multiRoleVoiceType") || "system",
      multiRoleNarratorVoice:
        ConfigService.getReaderConfig("multiRoleNarratorVoice") ||
        ConfigService.getReaderConfig("voiceName"),
      multiRoleMaleVoice:
        ConfigService.getReaderConfig("multiRoleMaleVoice") ||
        ConfigService.getReaderConfig("voiceName"),
      multiRoleFemaleVoice:
        ConfigService.getReaderConfig("multiRoleFemaleVoice") ||
        ConfigService.getReaderConfig("voiceName"),
      multiRoleNarratorEngine:
        ConfigService.getReaderConfig("multiRoleNarratorEngine") ||
        ConfigService.getReaderConfig("voiceEngine"),
      multiRoleMaleEngine:
        ConfigService.getReaderConfig("multiRoleMaleEngine") ||
        ConfigService.getReaderConfig("voiceEngine"),
      multiRoleFemaleEngine:
        ConfigService.getReaderConfig("multiRoleFemaleEngine") ||
        ConfigService.getReaderConfig("voiceEngine"),
      multiRoleChildVoice:
        ConfigService.getReaderConfig("multiRoleChildVoice") ||
        ConfigService.getReaderConfig("voiceName"),
      multiRoleChildEngine:
        ConfigService.getReaderConfig("multiRoleChildEngine") ||
        ConfigService.getReaderConfig("voiceEngine"),
    };
    this.nodeList = [];
    this.voices = [];
    this.customVoices = [];
    this.nativeVoices = [];
    this.previewPlayer = null;
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
                  item.plugin = "system";
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
    if (nextProps.currentBook?.key !== this.props.currentBook?.key) {
      this.setState({
        multiRoleEnabled: ConfigService.getAllListConfig(
          "multiRoleVoiceBooks"
        ).includes(nextProps.currentBook?.key),
      });
    }
  }
  componentWillUnmount() {
    this.stopPreviewAudio();
  }
  handleMultiRoleToggle = (enabled: boolean) => {
    if (enabled) {
      if (!this.props.isAuthed) {
        toast(this.props.t("Please upgrade to Pro to use this feature"));
        this.props.handleSetting(true);
        this.props.handleSettingMode("account");
        return;
      }
      ConfigService.setListConfig(
        this.props.currentBook.key,
        "multiRoleVoiceBooks"
      );
    } else {
      ConfigService.deleteListConfig(
        this.props.currentBook.key,
        "multiRoleVoiceBooks"
      );
    }
    this.setState({ multiRoleEnabled: enabled });
  };
  stopPreviewAudio = () => {
    window.speechSynthesis && window.speechSynthesis.cancel();
    if (this.previewPlayer) {
      this.previewPlayer.stop();
      this.previewPlayer.unload();
      this.previewPlayer = null;
    }
  };
  getPreviewText = (voice: any) => {
    const voiceCode =
      voice?.locale ||
      voice?.lang ||
      voice?.language ||
      this.state.voiceLocale ||
      navigator.language ||
      "en";
    const normalizedCode = voiceCode.toLowerCase().split("-")[0];
    const speech =
      KookitConfig.SpeechList.find((item) => item.code === normalizedCode) ||
      KookitConfig.SpeechList[0];
    return speech.example;
  };
  getVoiceByNameAndEngine = (voiceName: string, voiceEngine: string) => {
    return this.voices.find(
      (item: any) => item.name === voiceName && item.plugin === voiceEngine
    );
  };
  handlePreviewVoice = async (voiceName: string, voiceEngine: string) => {
    if (!voiceName) {
      toast(this.props.t("Please select"));
      return;
    }
    const engine = voiceEngine || "system";
    const voice = this.getVoiceByNameAndEngine(voiceName, engine);
    if (!voice) {
      toast.error(this.props.t("Audio loading failed, stopped playback"));
      return;
    }
    const previewText = this.getPreviewText(voice);
    const speed = parseFloat(ConfigService.getReaderConfig("voiceSpeed")) || 1;

    this.stopPreviewAudio();

    if (engine === "system") {
      const msg = new SpeechSynthesisUtterance();
      msg.text = previewText;
      msg.voice =
        this.nativeVoices.find((item: any) => item.name === voiceName) ||
        this.nativeVoices[0];
      msg.rate = speed;
      msg.onerror = () => {
        toast.error(this.props.t("Audio loading failed, stopped playback"));
      };
      window.speechSynthesis && window.speechSynthesis.speak(msg);
      return;
    }

    if (engine === "official-ai-voice-plugin") {
      if (!this.props.isAuthed) {
        toast(this.props.t("Please upgrade to Pro to use this feature"));
        return;
      }
      await fetchUserInfo();
    }

    const plugin = this.props.plugins.find((item) => item.key === engine);
    if (!plugin) {
      toast.error(this.props.t("Audio loading failed, stopped playback"));
      return;
    }
    const pluginVoice = (plugin.voiceList as any[]).find(
      (item) => item.name === voiceName
    );
    if (!pluginVoice) {
      toast.error(this.props.t("Audio loading failed, stopped playback"));
      return;
    }
    const audioPath = await TTSUtil.getAudioPath(
      previewText,
      speed * 100 - 100,
      engine,
      plugin,
      pluginVoice,
      true
    );
    if (!audioPath) {
      toast.error(this.props.t("Audio loading failed, stopped playback"));
      return;
    }
    this.previewPlayer = new Howl({
      src: [audioPath],
      format: [getFormatFromAudioPath(audioPath)],
      onloaderror: () => {
        toast.error(this.props.t("Audio loading failed, stopped playback"));
      },
    });
    this.previewPlayer.play();
  };
  renderVoicePreviewLabel = (
    label: string,
    voiceName: string,
    voiceEngine: string
  ) => {
    return (
      <span className="tts-preview-label">
        <Trans>{label}</Trans>
        <span
          className="tts-preview-btn"
          title={this.props.t("Test")}
          onClick={() => this.handlePreviewVoice(voiceName, voiceEngine)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 10v4h3l4 4V6L6 10H3zm11.5 2a3.5 3.5 0 0 0-2-3.15v6.29A3.5 3.5 0 0 0 14.5 12zm0-7.5v2.06A7.003 7.003 0 0 1 19 12a7.003 7.003 0 0 1-4.5 5.44v2.06c3.45-.9 6-4.03 6-7.5s-2.55-6.6-6-7.5z" />
          </svg>
        </span>
      </span>
    );
  };

  getVoicesByType = (voiceType: string) => {
    const locale = this.state.voiceLocale;
    const voiceList = this.state.voiceList[locale] || this.voices;

    if (voiceType === "system") {
      return voiceList.filter((item: any) => item.plugin === "system");
    } else if (voiceType === "official-ai-voice-plugin") {
      return voiceList.filter(
        (item: any) => item.plugin === "official-ai-voice-plugin"
      );
    } else if (voiceType === "custom") {
      return voiceList.filter(
        (item: any) =>
          item.plugin &&
          item.plugin !== "system" &&
          item.plugin !== "official-ai-voice-plugin"
      );
    }
    return voiceList;
  };
  handleStartAudio = async () => {
    if (
      this.props.isAuthed &&
      ConfigService.getReaderConfig("voiceEngine") !== "system"
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
    if (window.speechSynthesis) {
      if (window.speechSynthesis.speaking) {
        // 在句子中途暂停，保留 utterance 状态以便从暂停位置恢复
        window.speechSynthesis.pause();
      } else {
        window.speechSynthesis.cancel();
      }
    }
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
    const currentNode = this.nodeList[this.state.currentIndex];
    if (!currentNode) return;

    this.setState({ isPaused: false }, () => {
      if (currentNode.voiceEngine !== "system") {
        // 尝试从自定义音频暂停位置恢复，失败则从句首重新播放
        const resumed = TTSUtil.resumeAudio();
        if (!resumed) {
          this.handleCustomRead(this.state.currentIndex);
        }
      } else {
        // 若 Web Speech API 处于暂停状态则从暂停位置恢复，否则从句首重新朗读
        if (window.speechSynthesis && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        } else {
          this.handleSystemRead(this.state.currentIndex);
        }
      }
    });
  };
  handlePrevSentence = async () => {
    if (!this.state.isAudioOn || this.nodeList.length === 0) return;
    let prevIndex = Math.max(0, this.state.currentIndex - 1);
    window.speechSynthesis && window.speechSynthesis.cancel();
    await TTSUtil.pauseAudio();
    TTSUtil.pausedMidSentence = false; // 跳转句子时不从暂停位置恢复
    this.setState({ currentIndex: prevIndex, isPaused: false }, () => {
      if (this.nodeList[prevIndex].voiceEngine !== "system") {
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
    TTSUtil.pausedMidSentence = false; // 跳转句子时不从暂停位置恢复
    if (nextIndex >= this.nodeList.length) {
      // Move to next page
      this.setState({ currentIndex: 0, isPaused: false }, async () => {
        this.nodeList = [];
        await this.handleAudio();
      });
    } else {
      this.setState({ currentIndex: nextIndex, isPaused: false }, () => {
        if (this.nodeList[nextIndex].voiceEngine !== "system") {
          this.handleCustomRead(nextIndex);
        } else {
          this.handleSystemRead(nextIndex);
        }
      });
    }
  };
  handleVoiceSwitch = async (
    newVoiceName: string,
    newVoiceEngine: string,
    previousEngine: string
  ) => {
    if (!this.state.isAudioOn || this.nodeList.length === 0) return;

    const currentIndex = this.state.currentIndex;

    // 鉴权检查（AI 语音）
    if (newVoiceEngine === "official-ai-voice-plugin" && !this.props.isAuthed) {
      toast(this.props.t("Please upgrade to Pro to use this feature"));
      return;
    }

    // 停止系统语音
    window.speechSynthesis && window.speechSynthesis.cancel();

    // 停止自定义音频播放器
    const player = TTSUtil.getPlayer();
    if (player && player.stop) {
      player.stop();
    }
    TTSUtil.isPaused = true;
    TTSUtil.pausedMidSentence = false;

    // 若之前是 AI 语音，清除已生成的音频文件
    if (previousEngine === "official-ai-voice-plugin") {
      await TTSUtil.clearAudioPaths();
    }
    // 重置内存中的音频路径缓存（适用于所有引擎切换）
    TTSUtil.setAudioPaths();

    // AI 语音需要刷新用户信息
    if (this.props.isAuthed && newVoiceEngine !== "system") {
      toast.loading(this.props.t("Loading audio, please wait..."), {
        id: "tts-load",
      });
      await fetchUserInfo();
    }

    // 非多角色模式下，将 nodeList 所有节点更新为新语音
    if (!this.state.multiRoleEnabled) {
      this.nodeList = this.nodeList.map((node) => ({
        ...node,
        voiceName: newVoiceName,
        voiceEngine: newVoiceEngine,
      }));
    }

    // 先将 isPaused 置 true 终止旧循环，再置 false 从当前句子重新播放
    this.setState({ isPaused: true }, () => {
      this.setState({ isPaused: false }, () => {
        if (newVoiceEngine !== "system") {
          this.handleCustomRead(currentIndex);
        } else {
          this.handleSystemRead(currentIndex);
        }
      });
    });
  };
  handleStartSpeech = () => {
    this.setState({ isAudioOn: true, isPaused: false, currentIndex: 0 }, () => {
      this.handleAudio();
    });
  };
  handleAudio = async () => {
    this.nodeList = await this.handleGetText();
    if (this.nodeList.length === 0) {
      return;
    }
    if (this.nodeList[0].voiceEngine !== "system") {
      toast.loading(this.props.t("Loading audio, please wait..."), {
        id: "tts-load",
      });

      await this.handleCustomRead(0);
    } else {
      await this.handleSystemRead(0);
    }
  };
  handleGetText = async () => {
    if (ConfigService.getReaderConfig("isSliding") === "yes") {
      await sleep(1000);
    }
    let nodeList = [];
    let nodeTextList = (await this.props.htmlBook.rendition.audioText()).filter(
      (item: string) => item && item.trim()
    );
    let rawNodeList: string[][] = [];
    if (
      this.props.currentBook.format === "PDF" &&
      ConfigService.getReaderConfig("isConvertPDF") !== "yes"
    ) {
    } else {
      rawNodeList = nodeTextList.map((text) => {
        return splitSentences(text);
      });

      nodeTextList = rawNodeList.flat();
    }
    if (!this.state.multiRoleEnabled || !this.props.isAuthed) {
      nodeList = nodeTextList.map((text: string) => {
        return {
          text,
          voiceName: ConfigService.getReaderConfig("voiceName"),
          voiceEngine: ConfigService.getReaderConfig("voiceEngine"),
        };
      });
    } else {
      toast.loading(this.props.t("Analyzing roles, please wait..."), {
        id: "tts-load",
      });
      if (nodeTextList.join("").length > 50000) {
        toast.error(this.props.t("The text is too long to analyze"), {
          id: "tts-load",
        });
        this.setState({ isAudioOn: false });
        return [];
      }
      let splitTextList = rawNodeList.flatMap((texts, index) =>
        texts.map((text) => ({ text, index: index }))
      );
      let res = await getSplitSentence(splitTextList);
      toast.dismiss("tts-load");

      let narratorVoice = this.state.multiRoleNarratorVoice;
      let narratorEngine = this.state.multiRoleNarratorEngine;
      let maleVoice = this.state.multiRoleMaleVoice;
      let maleEngine = this.state.multiRoleMaleEngine;
      let femaleVoice = this.state.multiRoleFemaleVoice;
      let femaleEngine = this.state.multiRoleFemaleEngine;
      let childVoice = this.state.multiRoleChildVoice;
      let childEngine = this.state.multiRoleChildEngine;
      if (res && res.data && res.data.sentences) {
        nodeList = res.data.sentences.map((item: any) => {
          let voiceName = narratorVoice;
          let voiceEngine = narratorEngine;
          if (item.role === "male") {
            voiceName = maleVoice || narratorVoice;
            voiceEngine = maleEngine || narratorEngine;
          } else if (item.role === "female") {
            voiceName = femaleVoice || narratorVoice;
            voiceEngine = femaleEngine || narratorEngine;
          } else if (item.role === "child") {
            voiceName = childVoice || narratorVoice;
            voiceEngine = childEngine || narratorEngine;
          }
          return {
            text: item.text,
            voiceName,
            voiceEngine,
          };
        });
      } else {
        toast.error(this.props.t("Analysis failed"));
        this.setState({ isAudioOn: false });
        return [];
      }
    }

    if (nodeList.length === 0) {
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

      nodeList = await this.handleGetText();
    }
    return nodeList;
  };
  async handleCustomRead(nodeIndex: number) {
    let speed = parseFloat(ConfigService.getReaderConfig("voiceSpeed")) || 1;
    if (!this.state.isAudioOn) {
      TTSUtil.setAudioPaths();
    }

    for (let index = nodeIndex; index < this.nodeList.length; index++) {
      if (this.state.isPaused || !this.state.isAudioOn) return;
      this.setState({ currentIndex: index });
      let node = this.nodeList[index];
      let style = "background: #f3a6a68c;";
      this.props.htmlBook.rendition.highlightAudioNode(node.text, style);
      if (index === nodeIndex) {
        let result = await TTSUtil.cacheAudio(
          index,
          speed * 100 - 100,
          this.props.plugins,
          this.nodeList,
          5,
          true,
          node.voiceEngine === "official-ai-voice-plugin"
        );
        toast.dismiss("tts-load");
        if (result === "error") {
          toast.error(this.props.t("Audio loading failed, stopped playback"));
          this.setState({ isAudioOn: false });
          this.nodeList = [];
          return;
        }
      }
      if (this.nodeList[index].voiceEngine === "system") {
        await this.handleSystemRead(index);
        break;
      }

      TTSUtil.cacheAudio(
        index + 1,
        speed * 100 - 100,
        this.props.plugins,
        this.nodeList,
        10,
        false,
        node.voiceEngine === "official-ai-voice-plugin"
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
      let isReachPageEnd =
        this.nodeList[index].text ===
        lastVisibleTextList[lastVisibleTextList.length - 1];
      if (
        this.state.multiRoleEnabled &&
        lastVisibleTextList[lastVisibleTextList.length - 1] &&
        (lastVisibleTextList[lastVisibleTextList.length - 1].indexOf("“") >
          -1 ||
          lastVisibleTextList[lastVisibleTextList.length - 1].indexOf('"') > -1)
      ) {
        isReachPageEnd = lastVisibleTextList[
          lastVisibleTextList.length - 1
        ].endsWith(this.nodeList[index].text);
      }
      if (index === this.nodeList.length - 1) {
        isReachPageEnd = true;
      }

      if (isReachPageEnd) {
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
          if (index === this.nodeList.length - 1) {
            await this.props.htmlBook.rendition.nextChapter();
          } else {
            await this.props.htmlBook.rendition.next();
          }
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
    let node = this.nodeList[index];
    let style = "background: #f3a6a68c;";
    this.props.htmlBook.rendition.highlightAudioNode(node.text, style);
    toast.dismiss("tts-load");
    let res = await this.handleSystemSpeech(
      index,
      node.voiceName || ConfigService.getReaderConfig("voiceName"),
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
      let isReachPageEnd =
        this.nodeList[index].text ===
        lastVisibleTextList[lastVisibleTextList.length - 1];
      if (
        this.state.multiRoleEnabled &&
        lastVisibleTextList[lastVisibleTextList.length - 1] &&
        (lastVisibleTextList[lastVisibleTextList.length - 1].indexOf("“") >
          -1 ||
          lastVisibleTextList[lastVisibleTextList.length - 1].indexOf('"') > -1)
      ) {
        isReachPageEnd = lastVisibleTextList[
          lastVisibleTextList.length - 1
        ].includes(this.nodeList[index].text);
      }
      if (index === this.nodeList.length - 1) {
        isReachPageEnd = true;
      }
      if (isReachPageEnd) {
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
          if (index === this.nodeList.length - 1) {
            await this.props.htmlBook.rendition.nextChapter();
          } else {
            await this.props.htmlBook.rendition.next();
          }
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
      if (
        this.nodeList[index] &&
        this.nodeList[index].voiceEngine !== "system"
      ) {
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
      msg.text = this.nodeList[index].text
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
          {this.renderVoicePreviewLabel(
            "Voice",
            ConfigService.getReaderConfig("voiceName"),
            ConfigService.getReaderConfig("voiceEngine")
          )}
          <select
            name=""
            className="lang-setting-dropdown"
            id="text-speech-voice"
            onChange={(event) => {
              let selectedValue = event.target.value;
              let [voiceName, plugin] = selectedValue.split("#");
              const previousEngine =
                ConfigService.getReaderConfig("voiceEngine");
              ConfigService.setReaderConfig("voiceName", voiceName);
              let voice = this.voices.find(
                (item) => item.name === voiceName && item.plugin === plugin
              );
              if (!voice) {
                return;
              }
              const newEngine = voice.plugin || "system";
              ConfigService.setReaderConfig("voiceEngine", newEngine);
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
              toast.success(this.props.t("Setup successful"));
              if (this.state.isAudioOn) {
                this.handleVoiceSwitch(voiceName, newEngine, previousEngine);
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
        {/* Multi-role reading section */}
        <div
          className="setting-dialog-new-title"
          style={{
            marginLeft: "20px",
            width: "88%",
            marginTop: "20px",
            fontWeight: 500,
          }}
        >
          <span style={{ width: "calc(100% - 50px)" }}>
            <Trans>AI multi-role speech</Trans>
          </span>

          <span
            className="single-control-switch"
            onClick={() => {
              this.handleMultiRoleToggle(!this.state.multiRoleEnabled);
            }}
            style={this.state.multiRoleEnabled ? {} : { opacity: 0.6 }}
          >
            <span
              className="single-control-button"
              style={
                this.state.multiRoleEnabled
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
        <p
          className="setting-option-subtitle"
          style={{ marginLeft: "20px", marginRight: "20px" }}
        >
          <Trans>
            {
              "Use AI to analyze books, with different characters reading aloud in different voices"
            }
          </Trans>
        </p>
        {this.state.multiRoleEnabled && (
          <>
            {/* Voice Type Selection */}
            <div
              className="setting-dialog-new-title"
              style={{ marginLeft: "20px", width: "88%", fontWeight: 500 }}
            >
              <Trans>Voice type</Trans>
              <select
                name=""
                className="lang-setting-dropdown"
                id="multi-role-voice-type"
                onChange={(event) => {
                  this.setState({ multiRoleVoiceType: event.target.value });
                  ConfigService.setReaderConfig(
                    "multiRoleVoiceType",
                    event.target.value
                  );
                }}
              >
                <option value="" className="lang-setting-option">
                  {this.props.t("Please select")}
                </option>
                <option
                  value="system"
                  className="lang-setting-option"
                  selected={this.state.multiRoleVoiceType === "system"}
                >
                  {this.props.t("System voice")}
                </option>
                <option
                  value="official-ai-voice-plugin"
                  className="lang-setting-option"
                  selected={
                    this.state.multiRoleVoiceType === "official-ai-voice-plugin"
                  }
                >
                  {this.props.t("Official AI Voice")}
                </option>
                <option
                  value="custom"
                  className="lang-setting-option"
                  selected={this.state.multiRoleVoiceType === "custom"}
                >
                  {this.props.t("Custom voice")}
                </option>
              </select>
            </div>
            {/* Narrator voice */}
            <div
              className="setting-dialog-new-title"
              style={{ marginLeft: "20px", width: "88%", fontWeight: 500 }}
            >
              {this.renderVoicePreviewLabel(
                "Narrator voice",
                this.state.multiRoleNarratorVoice,
                this.state.multiRoleNarratorEngine
              )}
              <select
                name=""
                className="lang-setting-dropdown"
                id="multi-role-narrator-voice"
                onChange={(event) => {
                  let selectedValue = event.target.value;
                  let [voiceName, plugin] = selectedValue.split("#");
                  ConfigService.setReaderConfig(
                    "multiRoleNarratorVoice",
                    voiceName
                  );
                  ConfigService.setReaderConfig(
                    "multiRoleNarratorEngine",
                    plugin || "system"
                  );
                  this.setState({
                    multiRoleNarratorVoice: voiceName,
                    multiRoleNarratorEngine: plugin || "system",
                  });
                  toast.success(this.props.t("Setup successful"));
                }}
              >
                <option value="" className="lang-setting-option">
                  {this.props.t("Please select")}
                </option>
                {this.getVoicesByType(this.state.multiRoleVoiceType).map(
                  (item) => (
                    <option
                      value={[item.name, item.plugin].join("#")}
                      key={[item.name, item.plugin].join("#")}
                      className="lang-setting-option"
                      selected={item.name === this.state.multiRoleNarratorVoice}
                    >
                      {this.props.t(item.displayName || item.name)}
                    </option>
                  )
                )}
              </select>
            </div>
            {/* Male voice */}
            <div
              className="setting-dialog-new-title"
              style={{ marginLeft: "20px", width: "88%", fontWeight: 500 }}
            >
              {this.renderVoicePreviewLabel(
                "Male voice",
                this.state.multiRoleMaleVoice,
                this.state.multiRoleMaleEngine
              )}
              <select
                name=""
                className="lang-setting-dropdown"
                id="multi-role-male-voice"
                onChange={(event) => {
                  let selectedValue = event.target.value;
                  let [voiceName, plugin] = selectedValue.split("#");
                  ConfigService.setReaderConfig(
                    "multiRoleMaleVoice",
                    voiceName
                  );
                  ConfigService.setReaderConfig(
                    "multiRoleMaleEngine",
                    plugin || "system"
                  );
                  this.setState({
                    multiRoleMaleVoice: voiceName,
                    multiRoleMaleEngine: plugin || "system",
                  });
                  toast.success(this.props.t("Setup successful"));
                }}
              >
                <option value="" className="lang-setting-option">
                  {this.props.t("Please select")}
                </option>
                {this.getVoicesByType(this.state.multiRoleVoiceType)
                  .filter((item) => !item.gender || item.gender === "male")
                  .map((item) => (
                    <option
                      value={[item.name, item.plugin].join("#")}
                      key={[item.name, item.plugin].join("#")}
                      className="lang-setting-option"
                      selected={item.name === this.state.multiRoleMaleVoice}
                    >
                      {this.props.t(item.displayName || item.name)}
                    </option>
                  ))}
              </select>
            </div>
            {/* Female voice */}
            <div
              className="setting-dialog-new-title"
              style={{ marginLeft: "20px", width: "88%", fontWeight: 500 }}
            >
              {this.renderVoicePreviewLabel(
                "Female voice",
                this.state.multiRoleFemaleVoice,
                this.state.multiRoleFemaleEngine
              )}
              <select
                name=""
                className="lang-setting-dropdown"
                id="multi-role-female-voice"
                onChange={(event) => {
                  let selectedValue = event.target.value;
                  let [voiceName, plugin] = selectedValue.split("#");
                  ConfigService.setReaderConfig(
                    "multiRoleFemaleVoice",
                    voiceName
                  );
                  ConfigService.setReaderConfig(
                    "multiRoleFemaleEngine",
                    plugin || "system"
                  );
                  this.setState({
                    multiRoleFemaleVoice: voiceName,
                    multiRoleFemaleEngine: plugin || "system",
                  });
                  toast.success(this.props.t("Setup successful"));
                }}
              >
                <option value="" className="lang-setting-option">
                  {this.props.t("Please select")}
                </option>
                {this.getVoicesByType(this.state.multiRoleVoiceType)
                  .filter((item) => !item.gender || item.gender === "female")
                  .map((item) => (
                    <option
                      value={[item.name, item.plugin].join("#")}
                      key={[item.name, item.plugin].join("#")}
                      className="lang-setting-option"
                      selected={item.name === this.state.multiRoleFemaleVoice}
                    >
                      {this.props.t(item.displayName || item.name)}
                    </option>
                  ))}
              </select>
            </div>
            {/* Child voice */}
            <div
              className="setting-dialog-new-title"
              style={{ marginLeft: "20px", width: "88%", fontWeight: 500 }}
            >
              {this.renderVoicePreviewLabel(
                "Child voice",
                this.state.multiRoleChildVoice,
                this.state.multiRoleChildEngine
              )}
              <select
                name=""
                className="lang-setting-dropdown"
                id="multi-role-child-voice"
                onChange={(event) => {
                  let selectedValue = event.target.value;
                  let [voiceName, plugin] = selectedValue.split("#");
                  ConfigService.setReaderConfig(
                    "multiRoleChildVoice",
                    voiceName
                  );
                  ConfigService.setReaderConfig(
                    "multiRoleChildEngine",
                    plugin || "system"
                  );
                  this.setState({
                    multiRoleChildVoice: voiceName,
                    multiRoleChildEngine: plugin || "system",
                  });
                  toast.success(this.props.t("Setup successful"));
                }}
              >
                <option value="" className="lang-setting-option">
                  {this.props.t("Please select")}
                </option>
                {this.getVoicesByType(this.state.multiRoleVoiceType).map(
                  (item) => (
                    <option
                      value={[item.name, item.plugin].join("#")}
                      key={[item.name, item.plugin].join("#")}
                      className="lang-setting-option"
                      selected={item.name === this.state.multiRoleChildVoice}
                    >
                      {this.props.t(item.displayName || item.name)}
                    </option>
                  )
                )}
              </select>
            </div>
          </>
        )}
      </>
    );
  }
}

export default TextToSpeech;
