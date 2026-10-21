const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { getTTSAudioPath, ensureTTSDir } = require("./ttsCache");
const getAudioPath = async (text, speed, dirPath, config) => {
  const audioPath = getTTSAudioPath(
    "elevenlabs-tts-voice-plugin",
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
  let voiceId = config.voiceId || "JBFqnCBsd6RMkjVDRZzb";
  let modelId = config.modelId || "eleven_multilingual_v2";
  let outputFormat = "mp3_44100_128";
  // speed: 0.7 ~ 1.2, default 1.0
  let voiceSettings = {
    speed: speed || 1.0,
  };
  let url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`;
  return new Promise((resolve, reject) => {
    axios
      .post(
        url,
        {
          text: text,
          model_id: modelId,
          voice_settings: voiceSettings,
        },
        {
          headers: {
            "xi-api-key": apiKey,
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
  let apiKey = config.apiKey || "";
  let url = `https://api.elevenlabs.io/v2/voices?page_size=100`;
  return new Promise((resolve, reject) => {
    axios
      .get(url, {
        headers: {
          "xi-api-key": apiKey,
        },
      })
      .then((response) => {
        let voices = response.data.voices;
        resolve(
          voices.map((voice) => {
            let labels = voice.labels || {};
            let gender = labels.gender || "unknown";
            let locale =
              labels.language ||
              (voice.verified_languages &&
                voice.verified_languages[0] &&
                voice.verified_languages[0].locale) ||
              "";
            return {
              name: voice.voice_id,
              gender: gender.toLowerCase(),
              locale: locale,
              displayName: `ElevenLabs - ${voice.name}${locale ? ` (${locale})` : ""}`,
              plugin: "elevenlabs-tts-voice-plugin",
              config: {
                ...config,
                voiceId: voice.voice_id,
              },
            };
          })
        );
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports = { getAudioPath, getTTSVoice };
