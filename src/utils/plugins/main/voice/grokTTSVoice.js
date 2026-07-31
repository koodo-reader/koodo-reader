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
    let voiceId = config.voiceId || "eve";
    let language = config.language || "auto";
    let url = "https://api.x.ai/v1/tts";
    let body = {
        text: text,
        voice_id: voiceId,
        language: language,
        output_format: {
            codec: "mp3",
            sample_rate: 24000,
            bit_rate: 128000,
        },
    };
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
            resolve(response.data);
        })
            .catch((error) => {
            reject("");
        });
    });
};
const getTTSVoice = async (config) => {
    const voiceList = [
        { voiceId: "eve", name: "Eve", gender: "female" },
        { voiceId: "ara", name: "Ara", gender: "female" },
        { voiceId: "rex", name: "Rex", gender: "male" },
        { voiceId: "sal", name: "Sal", gender: "male" },
        { voiceId: "leo", name: "Leo", gender: "male" },
    ];
    const languageList = [
        { code: "en", name: "English" },
        { code: "ar-EG", name: "Arabic (Egypt)" },
        { code: "ar-SA", name: "Arabic (Saudi Arabia)" },
        { code: "ar-AE", name: "Arabic (UAE)" },
        { code: "bn", name: "Bengali" },
        { code: "zh", name: "Chinese (Simplified)" },
        { code: "fr", name: "French" },
        { code: "de", name: "German" },
        { code: "hi", name: "Hindi" },
        { code: "id", name: "Indonesian" },
        { code: "it", name: "Italian" },
        { code: "ja", name: "Japanese" },
        { code: "ko", name: "Korean" },
        { code: "pt-BR", name: "Portuguese (Brazil)" },
        { code: "pt-PT", name: "Portuguese (Portugal)" },
        { code: "ru", name: "Russian" },
        { code: "es-MX", name: "Spanish (Mexico)" },
        { code: "es-ES", name: "Spanish (Spain)" },
        { code: "tr", name: "Turkish" },
        { code: "vi", name: "Vietnamese" },
    ];
    const result = [];
    for (const voice of voiceList) {
        for (const lang of languageList) {
            result.push({
                name: voice.voiceId,
                gender: voice.gender,
                locale: lang.code,
                displayName: `Grok TTS - ${voice.name} (${lang.name})`,
                plugin: "grok-tts-voice-plugin",
                config: {
                    ...config,
                    voiceId: voice.voiceId,
                    language: lang.code,
                },
            });
        }
    }
    return result;
};

module.exports = { getAudioPath, getTTSVoice };
