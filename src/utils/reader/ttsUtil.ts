import { Howl } from "howler";
import PluginModel from "../../models/Plugin";
import { getAllVoices, getFormatFromAudioPath } from "../common";
import { getTTSAudio } from "../request/reader";
import { isElectron } from "react-device-detect";
import { TextRule } from "../common";

const escapeRegExp = (pattern: string) =>
  pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class TTSUtil {
  static player: any;
  // 听书文本规则（replace / delete），朗读前应用到文本
  static textRules: TextRule[] = [];
  static audioPaths: { index: number; audioPath: string }[] = [];
  static isPaused: boolean = false;
  static pausedMidSentence: boolean = false;
  static processingIndexes: Set<number> = new Set();
  static async readAloud(currentIndex: number) {
    // 清理比当前 index 小 10 的已朗读缓存
    this.audioPaths = this.audioPaths.filter(
      (item) => item.index >= currentIndex - 10
    );
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
    speed: number,
    plugins: PluginModel[],
    audioNodeList: {
      text: string;
      voiceName: string;
      voiceEngine: string;
    }[],
    targetCacheCount: number,
    isFirst: boolean,
    isOfficialAIVoice: boolean
  ) {
    this.isPaused = false;

    if (isOfficialAIVoice) {
      const cacheCount = Math.min(
        targetCacheCount,
        audioNodeList.length - startIndex
      );
      // 并发执行，并发数量为3，但保证添加顺序
      const CONCURRENT_LIMIT = 10;
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

          const audioNode = audioNodeList[index];
          let plugin = plugins.find(
            (item) => item.key === audioNode.voiceEngine
          );
          if (!plugin) {
            return "error";
          }
          let voice = (plugin.voiceList as any[]).find(
            (voice) => voice.name === audioNode.voiceName
          );
          if (!voice) {
            return "error";
          }
          // 创建异步任务
          const task = this.getAudioPath(
            audioNode.text,
            speed,
            audioNode.voiceEngine,
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
        // 如果已经缓存过或正在处理中，跳过
        if (
          this.audioPaths.find((item) => item.index === index) ||
          this.processingIndexes.has(index)
        ) {
          continue;
        }
        // 标记为正在处理
        this.processingIndexes.add(index);
        const audioNode = audioNodeList[index];
        let plugin = plugins.find((item) => item.key === audioNode.voiceEngine);
        if (!plugin) {
          return "error";
        }
        let voice = (plugin.voiceList as any[]).find(
          (voice) => voice.name === audioNode.voiceName
        );
        if (!voice) {
          return "error";
        }
        let audioPath = await this.getAudioPath(
          audioNode.text,
          speed,
          audioNode.voiceEngine,
          plugin,
          voice,
          isFirst
        );
        // 处理完成后，从处理集合中移除
        this.processingIndexes.delete(index);
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
    if (this.player) {
      this.player.pause();
      this.isPaused = true;
      this.pausedMidSentence = true;
    }
  }
  static resumeAudio(): boolean {
    if (this.player && this.pausedMidSentence) {
      this.player.play();
      this.isPaused = false;
      this.pausedMidSentence = false;
      return true;
    }
    return false;
  }
  static async stopAudio() {
    if (this.player && this.player.stop) {
      this.player.stop();
      this.isPaused = true;
      this.pausedMidSentence = false;
      setTimeout(() => {
        this.clearAudioPaths();
        this.audioPaths = [];
        this.processingIndexes.clear();
      }, 1000);
    }
  }
  static async clearAudioPaths() {
    if (!isElectron) return;
    window.electronAPI.invoke("clear-tts");
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
    // 朗读前应用文本替换 / 删除规则
    text = this.applyTextRules(text);
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
        .electronAPI
        .invoke("generate-tts", {
          text: text,
          speed,
          pluginKey: plugin.key,
          config: voice.config,
        });
      return audioPath;
    }
  }
  static setAudioPaths() {
    this.audioPaths = [];
    this.processingIndexes.clear();
    this.pausedMidSentence = false;
  }
  static getPlayer() {
    return this.player;
  }
  static getVoiceList(plugins: PluginModel[]) {
    let voices = getAllVoices(plugins);

    return voices;
  }
  // 设置听书文本规则（仅 replace / delete 生效）
  static setTextRules(rules: TextRule[]) {
    this.textRules = rules.filter(
      (rule) => rule.type === "replace" || rule.type === "delete"
    );
  }
  // 对文本应用替换 / 删除规则
  static applyTextRules(text: string): string {
    if (!text || this.textRules.length === 0) return text;
    let result = text;
    for (const rule of this.textRules) {
      const regex =
        rule.matchType === "regex"
          ? new RegExp(rule.pattern, "g")
          : new RegExp(escapeRegExp(rule.pattern), "g");
      try {
        if (rule.type === "delete") {
          result = result.replace(regex, "");
        } else {
          // regex 模式保留 $1 分组引用（由 String.replace 原生处理）；
          // plain 模式转义 $ 防止被解释为分组引用
          const replacement =
            rule.matchType === "regex"
              ? rule.replacement || ""
              : (rule.replacement || "").replace(/\$/g, "$$$$");
          result = result.replace(regex, replacement);
        }
      } catch (e) {
        console.error("Invalid text rule pattern:", rule.pattern, e);
      }
    }
    return result;
  }
}
export default TTSUtil;
