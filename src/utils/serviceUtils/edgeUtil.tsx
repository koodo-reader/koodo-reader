import { voiceList } from "../../constants/voiceList";
import { Howl } from "howler";
class EdgeUtil {
  static player: any;
  static currentAudioPath: string = "";
  static audioPaths: string[] = [];
  static async readAloud(currentIndex: number) {
    return new Promise<string>(async (resolve, reject) => {
      let audioPath = this.audioPaths[currentIndex];
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
    voiceName: string,
    speed: number = 0
  ) {
    for (let index = 0; index < nodeList.length; index++) {
      const nodeText = nodeList[index];
      let audioPath = await window
        .require("electron")
        .ipcRenderer.invoke("edge-tts", {
          text: this.createSSML(
            nodeText
              .replace(/\s\s/g, "")
              .replace(/\r/g, "")
              .replace(/\n/g, "")
              .replace(/\t/g, "")
              .replace(/\f/g, ""),
            voiceName,
            speed
          ),
          format: "",
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
  static createSSML(text: string, voiceName: string, speed: number) {
    let ssml =
      // eslint-disable-next-line
      '\
        <speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">\
          <voice name="' +
      voiceName +
      // eslint-disable-next-line
      '">\
              <prosody rate="' +
      speed +
      // eslint-disable-next-line
      '%" pitch="0%">\
                  ' +
      text +
      // eslint-disable-next-line
      "\
              </prosody >\
          </voice >\
        </speak > ";

    return ssml;
  }
  static async getVoiceList() {
    return new Promise<any[]>((resolve, reject) => {
      resolve(voiceList);
      // fetch(
      //   "https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4"
      // )
      //   .then((response) => {
      //     if (response.status === 200) {
      //       return response.json();
      //     } else {
      //       return response.text().then((text) => Promise.reject(text));
      //     }
      //   })
      //   .then((data) => {
      //     resolve(data);
      //   })
      //   .catch((reason) => {
      //     resolve([]);
      //   });
    });
  }
}
export default EdgeUtil;
