const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { getTTSAudioPath, ensureTTSDir } = require("./ttsCache");
const getAudioPath = async (text, speed, dirPath, config) => {
  const audioPath = getTTSAudioPath(
    "coquitts-voice-plugin",
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
const objectToQueryString = (obj) => {
  const queryParams = [];
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(value);
      queryParams.push(`${encodedKey}=${encodedValue}`);
    }
  }
  return queryParams.join("&");
};
const getTTSAudio = async (text, speed, config) => {
  let url = config.url || "http://127.0.0.1:5002/api/tts";
  let speaker_id = config.speaker_id || "";
  let language_id = config.language_id || "";
  let style_wav = config.style_wav || "";
  return new Promise((resolve, reject) => {
    axios
      .get(
        url +
          "?" +
          objectToQueryString({
            text,
            speaker_id,
            language_id,
            style_wav,
          }),
        { responseType: "arraybuffer" }
      )
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports = { getAudioPath };
