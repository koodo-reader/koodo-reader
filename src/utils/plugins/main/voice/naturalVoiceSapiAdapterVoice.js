const fs = require("fs");
const { getTTSAudioPath, ensureTTSDir } = require("./ttsCache");
const {
  listVoices,
  synthesizeToWaveFile,
} = require("../../../main/sapi-util");

const PLUGIN_KEY = "natural-voice-sapi-adapter-voice-plugin";

let partId = 0;

const getTTSVoice = () => listVoices(PLUGIN_KEY);

const getAudioPath = async (text, speed, dirPath, config) => {
  const voiceName =
    config && typeof config.voiceName === "string" ? config.voiceName : "";
  if (!voiceName) {
    throw new Error("Invalid SAPI voice config");
  }
  if (typeof text !== "string" || !text) {
    throw new Error("Invalid SAPI text");
  }
  const audioPath = getTTSAudioPath(
    PLUGIN_KEY,
    text,
    speed,
    { voiceName },
    dirPath,
    ".wav"
  );
  if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 0) {
    return audioPath;
  }
  ensureTTSDir(dirPath);
  const partPath = audioPath + "." + process.pid + "-" + ++partId + ".part.wav";
  try {
    const response = await synthesizeToWaveFile({
      text,
      voiceName,
      speed,
      outPath: partPath,
    });
    if (!response.ok) {
      throw new Error(response.error || "SAPI synthesis failed");
    }
    if (!fs.existsSync(partPath) || fs.statSync(partPath).size === 0) {
      throw new Error("SAPI synthesis produced no audio");
    }
    fs.renameSync(partPath, audioPath);
    return audioPath;
  } catch (error) {
    // 与听书流程保持一致：合成失败时返回空，由上层暂停朗读并提示
    console.error("SAPI synthesis failed:", error.message);
    return "";
  } finally {
    if (fs.existsSync(partPath)) {
      try {
        fs.unlinkSync(partPath);
      } catch (error) {
        // ignore
      }
    }
  }
};

module.exports = { getAudioPath, getTTSVoice, PLUGIN_KEY };
