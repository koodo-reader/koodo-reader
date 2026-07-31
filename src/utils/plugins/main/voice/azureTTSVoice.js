const path = require("path");
const fs = require("fs");
const axios = require("axios");
const getAudioPath = async (text, speed, dirPath, config) => {
    let audioName = new Date().getTime() + ".mp3";
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
    let region = config.region || "eastus";
    let apiKey = config.apiKey || "";
    let voiceName = config.voiceName || "en-US-AvaMultilingualNeural";
    let outputFormat = "audio-16khz-128kbitrate-mono-mp3";
    // speed is a multiplier: 1.0 = normal, e.g. 0.5 = slow, 2.0 = fast
    let rate = speed ? `${Math.round((speed - 1) * 100)}%` : "0%";
    let ssml = `<speak version='1.0' xml:lang='en-US'><voice name='${voiceName}'><prosody rate='${rate}'>${text}</prosody></voice></speak>`;
    let url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    return new Promise((resolve, reject) => {
        axios
            .post(url, ssml, {
            headers: {
                "Ocp-Apim-Subscription-Key": apiKey,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": outputFormat,
                "User-Agent": "koodo-reader",
            },
            responseType: "arraybuffer",
        })
            .then((response) => {
            resolve(response.data);
        })
            .catch((error) => {
            reject("");
        });
    });
};
const getTTSVoice = async (config) => {
    let region = config.region || "eastus";
    let apiKey = config.apiKey || "";
    let url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
    return new Promise((resolve, reject) => {
        axios
            .get(url, {
            headers: {
                "Ocp-Apim-Subscription-Key": apiKey,
            },
        })
            .then((response) => {
            let voices = response.data;
            resolve(voices.map((voice) => {
                return {
                    name: voice.ShortName,
                    gender: voice.Gender.toLowerCase(),
                    locale: voice.Locale,
                    displayName: `Azure TTS - ${voice.LocalName} (${voice.Locale}) - ${voice.Gender}`,
                    plugin: "azure-tts-voice-plugin",
                    config: {
                        ...config,
                        voiceName: voice.ShortName,
                    },
                };
            }));
        })
            .catch((error) => {
            reject("");
        });
    });
};

module.exports = { getAudioPath, getTTSVoice };
