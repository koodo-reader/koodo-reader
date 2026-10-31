const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { getTTSAudioPath, ensureTTSDir } = require("./ttsCache");
const getAudioPath = async (text, speed, dirPath, config) => {
  const audioPath = getTTSAudioPath(
    "openai-tts-voice-plugin",
    text,
    speed,
    config,
    dirPath,
    ".mp3"
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
  let baseUrl = config.baseUrl || "https://api.openai.com";
  let model = config.model || "gpt-4o-mini-tts";
  let voiceName = config.voiceName || "coral";
  // speed range: 0.25 ~ 4.0, default 1.0
  let speedValue = speed ? Math.min(4.0, Math.max(0.25, speed)) : 1.0;
  let url = `${baseUrl}/v1/audio/speech`;
  return new Promise((resolve, reject) => {
    axios
      .post(
        url,
        {
          model: model,
          input: text,
          voice: voiceName,
          speed: speedValue,
          response_format: "mp3",
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
        }
      )
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
const getTTSVoice = async (config) => {
  const voices = [
    { name: "alloy", gender: "female" },
    { name: "ash", gender: "male" },
    { name: "ballad", gender: "male" },
    { name: "coral", gender: "female" },
    { name: "echo", gender: "male" },
    { name: "fable", gender: "male" },
    { name: "nova", gender: "female" },
    { name: "onyx", gender: "male" },
    { name: "sage", gender: "female" },
    { name: "shimmer", gender: "female" },
    { name: "verse", gender: "male" },
    { name: "marin", gender: "female" },
    { name: "cedar", gender: "male" },
  ];
  return Promise.resolve(
    voices.map((voice) => ({
      name: voice.name,
      gender: voice.gender,
      locale: "en",
      displayName: `OpenAI TTS - ${voice.name}`,
      plugin: "openai-tts-voice-plugin",
      config: {
        ...config,
        voiceName: voice.name,
      },
    }))
  );
};

module.exports = { getAudioPath, getTTSVoice };
