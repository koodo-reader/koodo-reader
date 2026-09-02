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
            .post(url, {
            text: text,
            model_id: modelId,
            voice_settings: voiceSettings,
        }, {
            headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
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
            resolve(voices.map((voice) => {
                let labels = voice.labels || {};
                let gender = labels.gender || "unknown";
                let locale = labels.language ||
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
            }));
        })
            .catch((error) => {
            reject("");
        });
    });
};

module.exports = { getAudioPath, getTTSVoice };
