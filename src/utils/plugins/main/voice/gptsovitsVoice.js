const path = require("path");
const fs = require("fs");
const axios = require("axios");
const getAudioPath = async (text, speed, dirPath, config) => {
    const supportedFormats = new Set([
        "wav",
        "mp3",
        "ogg",
        "flac",
        "aac",
        "m4a",
        "opus",
    ]);
    const requestedFormat = String(config.voiceFormat || "wav").toLowerCase();
    const voiceFormat = supportedFormats.has(requestedFormat)
        ? requestedFormat
        : "wav";
    let audioName = new Date().getTime() + "." + voiceFormat;
    if (!fs.existsSync(path.join(dirPath, "tts"))) {
        fs.mkdirSync(path.join(dirPath, "tts"));
        fs.writeFileSync(path.join(dirPath, "tts", audioName), await getTTSAudio(text, speed, config));
    }
    else {
        fs.writeFileSync(path.join(dirPath, "tts", audioName), await getTTSAudio(text, speed, config));
    }
    return path.join(dirPath, "tts", audioName);
};
const getTTSAudio = async (text, speed, config) => {
    let url = config.url || "http://127.0.0.1:9880";
    let text_language = config.text_language || "zh";
    let prompt_language = config.prompt_language || "zh";
    let refer_wav_path = config.refer_wav_path || "";
    let prompt_text = config.prompt_text || "zh";
    let cut_punc = config.cut_punc || "，。";
    return new Promise((resolve, reject) => {
        axios.post(url, {
            refer_wav_path,
            prompt_text,
            prompt_language,
            text,
            text_language,
            cut_punc
        }, { responseType: "arraybuffer" })
            .then(response => {
            resolve(response.data);
        })
            .catch(error => {
            reject("");
        });
    });
};

module.exports = { getAudioPath };
