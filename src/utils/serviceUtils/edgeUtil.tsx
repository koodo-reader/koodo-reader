import { voiceList } from "../../constants/voiceList";

class EdgeUtil {
  static player: AudioBufferSourceNode;
  //`<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">          <voice name="zh-CN-XiaoxiaoNeural"> <prosody rate="0%" pitch="0%">如果喜欢这个项目的话请点个 Star 吧。</prosody ></voice > </speak >`
  static async readAloud(text: string, voiceName: string) {
    let audioBuffer = await window
      .require("electron")
      .ipcRenderer.invoke("edge-tts", {
        text: this.createSSML(text, voiceName),
        format: "",
      });
    let ctx = new AudioContext();
    let audio = await ctx.decodeAudioData(this.toArrayBuffer(audioBuffer));
    this.player = ctx.createBufferSource();
    this.player.buffer = audio;
    this.player.connect(ctx.destination);
    this.player.start(ctx.currentTime);
  }
  static pauseAudio() {
    if (this.player && this.player.stop) {
      this.player.stop();
      this.player.disconnect();
    }
  }
  static getPlayer() {
    return this.player;
  }
  static createSSML(text: string, voiceName: string) {
    let ssml =
      // eslint-disable-next-line
      '\
        <speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">\
          <voice name="' +
      voiceName +
      // eslint-disable-next-line
      '">\
              <prosody rate="0%" pitch="0%">\
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
  static toArrayBuffer(buffer) {
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
      view[i] = buffer[i];
    }
    return arrayBuffer;
  }
}
export default EdgeUtil;
