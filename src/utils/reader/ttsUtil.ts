import { Howl } from "howler";
import PluginModel from "../../models/Plugin";
import { getAllVoices, getFormatFromAudioPath } from "../common";
import { getTTSAudio } from "../request/reader";
import { isElectron } from "react-device-detect";

class TTSUtil {
  static player: any;
  static currentAudioPath: string = "";
  static audioPaths: { index: number; audioPath: string }[] = [];
  static isPaused: boolean = false;
  static voiceEngine: string = "";
  static processingIndexes: Set<number> = new Set();
  static async readAloud(currentIndex: number) {
    return new Promise<string>(async (resolve) => {
      let audioPath = this.audioPaths.find(
        (item) => item.index === currentIndex
      )?.audioPath;
      if (!audioPath) {
        resolve("loaderror");
        return;
      }
      var sound = new Howl({
        src: [audioPath],
        format: [getFormatFromAudioPath(audioPath)],
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
    startIndex: number,
    voiceName: string,
    speed: number,
    voiceEngine: string,
    plugins: PluginModel[],
    audioNodeList: string[],
    targetCacheCount: number,
    isFirst: boolean
  ) {
    this.voiceEngine = voiceEngine;
    this.isPaused = false;
    let plugin = plugins.find((item) => item.key === voiceEngine);
    if (!plugin) {
      return "error";
    }
    let voice = (plugin.voiceList as any[]).find(
      (voice) => voice.name === voiceName
    );
    if (!voice) {
      return "error";
    }
    if (voiceEngine === "official-ai-voice-plugin") {
      const cacheCount = Math.min(
        targetCacheCount,
        audioNodeList.length - startIndex
      );
      // 并发执行，并发数量为3，但保证添加顺序
      const CONCURRENT_LIMIT = 5;
      //删除index小于startIndex的缓存
      this.audioPaths = this.audioPaths.filter(
        (item) => item.index >= startIndex - 5
      );

      for (let i = 0; i < cacheCount; i += CONCURRENT_LIMIT) {
        const batch: any[] = [];

        for (let j = 0; j < CONCURRENT_LIMIT && i + j < cacheCount; j++) {
          const index = startIndex + i + j;
          if (index >= audioNodeList.length) break;

          // 如果已经缓存过或正在处理中，跳过
          if (
            this.audioPaths.find((item) => item.index === index) ||
            this.processingIndexes.has(index)
          ) {
            continue;
          }

          // 标记为正在处理
          this.processingIndexes.add(index);

          const text = audioNodeList[index];
          // 创建异步任务
          const task = this.getAudioPath(
            text,
            speed,
            voiceEngine,
            plugin,
            voice,
            isFirst
          )
            .then(async (res) => {
              // 处理完成后，从处理集合中移除
              this.processingIndexes.delete(index);
              if (res) {
                return { index, audioPath: res };
              } else {
                this.isPaused = true;
                return null;
              }
            })
            .catch((error) => {
              // 出错时也要从处理集合中移除
              this.processingIndexes.delete(index);
              console.error(`Error caching audio for index ${index}:`, error);
              return null;
            });
          batch.push(task);
        }

        // 等待当前批次完成
        const batchResults = await Promise.all(batch);

        // 将结果存储到 Map 中
        for (const result of batchResults) {
          if (result) {
            if (this.audioPaths.find((item) => item.index === result.index)) {
              this.audioPaths = this.audioPaths.map((item) => {
                if (item.index === result.index) {
                  return result;
                } else {
                  return item;
                }
              });
            } else {
              this.audioPaths.push(result);
            }
          } else {
            this.isPaused = true;
            return "error";
          }
        }
      }
    } else {
      let maxCacheIndex = Math.min(
        startIndex + targetCacheCount,
        audioNodeList.length
      );
      for (let index = startIndex; index < maxCacheIndex; index++) {
        if (this.isPaused) {
          break;
        }
        // 如果已经缓存过，跳过
        if (this.audioPaths.find((item) => item.index === index)) {
          continue;
        }
        const text = audioNodeList[index];
        let audioPath = await this.getAudioPath(
          text,
          speed,
          voiceEngine,
          plugin,
          voice,
          isFirst
        );
        if (audioPath) {
          this.audioPaths.push({ index: index, audioPath: audioPath });
        } else {
          this.isPaused = true;
          break;
        }
      }
    }
  }
  static async pauseAudio() {
    if (this.player && this.player.stop) {
      this.player.stop();
      this.isPaused = true;
      setTimeout(() => {
        this.clearAudioPaths();
        this.audioPaths = [];
        this.processingIndexes.clear();
      }, 1000);
    }
  }
  static async clearAudioPaths() {
    if (this.voiceEngine === "official-ai-voice-plugin") {
      return;
    }
    if (!isElectron) return;
    window.require("electron").ipcRenderer.invoke("clear-tts");
  }
  static getAudioPaths() {
    return this.audioPaths;
  }
  static async getAudioPath(
    text: string,
    speed: number,
    voiceEngine: string,
    plugin,
    voice,
    isFirst: boolean
  ) {
    if (voiceEngine === "official-ai-voice-plugin") {
      let res = await getTTSAudio(
        text,
        voice.language,
        voice.name,
        (speed + 100) / 100,
        1.0,
        isFirst
      );
      if (res && res.data && res.data.audio_base64) {
        return res.data.audio_base64;
      }
      return "";
    } else {
      let audioPath = await window
        .require("electron")
        .ipcRenderer.invoke("generate-tts", {
          text: text,
          speed,
          plugin: plugin,
          config: voice.config,
        });
      return audioPath;
    }
  }
  static setAudioPaths() {
    this.audioPaths = [];
    this.processingIndexes.clear();
  }
  static getPlayer() {
    return this.player;
  }
  static getVoiceList(plugins: PluginModel[]) {
    let voices = getAllVoices(plugins);
    if (isElectron) {
      return [...voices, { name: "Add new voice", url: "", type: "" }];
    } else {
      return voices;
    }
  }
}
export default TTSUtil;
