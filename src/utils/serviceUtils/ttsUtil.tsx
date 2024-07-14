import { Howl } from "howler";
import VoiceList from "../readUtils/voiceList";

class TTSUtil {
  static player: any;
  static currentAudioPath: string = "";
  static audioPaths: string[] = [];
  static async readAloud(currentIndex: number) {
    return new Promise<string>(async (resolve, reject) => {
      let audioPath = this.audioPaths[currentIndex];
      if (!audioPath) {
        resolve("loaderror");
      }
      var sound = new Howl({
        src: [audioPath],
        onloaderror: () => {
          resolve("loaderror");
        },
        onload: async () => {
          this.player.play();
          resolve("load");
        },
      });
      this.player = sound;
    });
  }
  static async cacheAudio(
    nodeList: string[],
    voiceIndex: number,
    speed: number = 0
  ) {
    let voiceList = VoiceList.getAllVoices();
    if (voiceIndex >= voiceList.length) {
      voiceIndex = 0;
    }
    let voice = voiceList[voiceIndex];
    if (!voice) {
      return;
    }
    for (let index = 0; index < nodeList.length; index++) {
      const nodeText = nodeList[index];
      let audioPath = await window
        .require("electron")
        .ipcRenderer.invoke("generate-tts", {
          text: nodeText
            .replace(/\s\s/g, "")
            .replace(/\r/g, "")
            .replace(/\n/g, "")
            .replace(/\t/g, "")
            .replace(/&/g, "")
            .replace(/\f/g, ""),
          speed,
          url: voice.url,
          type: voice.type,
        });
      this.audioPaths.push(audioPath);
    }
  }
  static async pauseAudio() {
    if (this.player && this.player.stop) {
      this.player.stop();
      window.require("electron").ipcRenderer.invoke("clear-tts");
    }
  }
  static getAudioPaths() {
    return this.audioPaths;
  }
  static setAudioPaths() {
    this.audioPaths = [];
  }
  static getPlayer() {
    return this.player;
  }
  static getVoiceList() {
    let voices = VoiceList.getAllVoices();
    return [...voices, { name: "Add new voice", url: "", type: "" }];
  }
}
export default TTSUtil;
