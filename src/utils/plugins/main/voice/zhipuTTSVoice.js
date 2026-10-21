const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { getTTSAudioPath, ensureTTSDir } = require("./ttsCache");
const getAudioPath = async (text, speed, dirPath, config) => {
  const audioPath = getTTSAudioPath(
    "zhipu-tts-voice-plugin",
    text,
    speed,
    config,
    dirPath,
    ".wav"
  );
  // 命中内容哈希缓存则直接复用，不再请求 TTS 接口
  if (fs.existsSync(audioPath)) {
    return audioPath;
  }
  ensureTTSDir(dirPath);
  fs.writeFileSync(audioPath, await getTTSAudio(text, speed, config));
  return audioPath;
};
const getTTSAudio = async (text, speed, config) => {
  let apiKey = config.apiKey || "";
  let voiceName = config.voiceName || "tongtong";
  const body = {
    model: "glm-tts",
    input: text,
    voice: voiceName,
    response_format: "wav",
    speed: speed || 1.0,
  };
  const url = "https://open.bigmodel.cn/api/paas/v4/audio/speech";
  return new Promise((resolve, reject) => {
    axios
      .post(url, body, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      })
      .then((response) => {
        resolve(Buffer.from(response.data));
      })
      .catch((error) => {
        reject(error);
      });
  });
};
const getTTSVoice = async (config) => {
  const voices = [
    {
      name: "tongtong",
      gender: "female",
      locale: "zh-CN",
      displayName: "彤彤 tongtong (zh-CN) - Female",
    },
    {
      name: "chuichui",
      gender: "male",
      locale: "zh-CN",
      displayName: "锤锤 chuichui (zh-CN) - Male",
    },
    {
      name: "xiaochen",
      gender: "male",
      locale: "zh-CN",
      displayName: "小陈 xiaochen (zh-CN) - Male",
    },
    {
      name: "jam",
      gender: "male",
      locale: "zh-CN",
      displayName: "jam (zh-CN) - Male",
    },
    {
      name: "kazi",
      gender: "female",
      locale: "zh-CN",
      displayName: "kazi (zh-CN) - Female",
    },
    {
      name: "douji",
      gender: "male",
      locale: "zh-CN",
      displayName: "douji (zh-CN) - Male",
    },
    {
      name: "luodo",
      gender: "male",
      locale: "zh-CN",
      displayName: "luodo (zh-CN) - Male",
    },
  ];
  return voices.map((voice) => ({
    name: voice.name,
    gender: voice.gender,
    locale: voice.locale,
    displayName: `Zhipu TTS - ${voice.displayName}`,
    plugin: "zhipu-tts-voice-plugin",
    config: {
      ...config,
      voiceName: voice.name,
    },
  }));
};

module.exports = { getAudioPath, getTTSVoice };
