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
    let model = config.model || "speech-02-hd";
    let voiceName = config.voiceName || "English_expressive_narrator";
    // speed range: 0.5 ~ 2.0, default 1.0
    let speedValue = speed ? Math.min(2.0, Math.max(0.5, speed)) : 1.0;
    let url = config.baseUrl + "/v1/t2a_v2";
    return new Promise((resolve, reject) => {
        axios
            .post(url, {
            model: model,
            text: text,
            stream: false,
            voice_setting: {
                voice_id: voiceName,
                speed: speedValue,
                vol: 1,
                pitch: 0,
            },
            audio_setting: {
                sample_rate: 32000,
                bitrate: 128000,
                format: "mp3",
                channel: 1,
            },
            output_format: "hex",
        }, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
            let hexAudio = response.data && response.data.data && response.data.data.audio;
            if (!hexAudio) {
                reject("");
                return;
            }
            resolve(Buffer.from(hexAudio, "hex"));
        })
            .catch((error) => {
            reject("");
        });
    });
};
const getLocaleFromVoiceId = (voiceId) => {
    if (voiceId.startsWith("English_") || voiceId.startsWith("English "))
        return "en-US";
    if (voiceId.startsWith("Chinese (Mandarin)") ||
        voiceId.startsWith("Mandarin_"))
        return "zh-CN";
    if (voiceId.startsWith("Cantonese"))
        return "zh-HK";
    if (voiceId.startsWith("Japanese_"))
        return "ja-JP";
    if (voiceId.startsWith("Korean_"))
        return "ko-KR";
    if (voiceId.startsWith("Spanish_"))
        return "es-ES";
    if (voiceId.startsWith("Portuguese_"))
        return "pt-BR";
    if (voiceId.startsWith("French_"))
        return "fr-FR";
    if (voiceId.startsWith("German_"))
        return "de-DE";
    if (voiceId.startsWith("Russian_"))
        return "ru-RU";
    if (voiceId.startsWith("Italian_"))
        return "it-IT";
    if (voiceId.startsWith("Dutch_"))
        return "nl-NL";
    if (voiceId.startsWith("Arabic_"))
        return "ar";
    if (voiceId.startsWith("Turkish_"))
        return "tr-TR";
    if (voiceId.startsWith("Ukrainian_"))
        return "uk-UA";
    if (voiceId.startsWith("Thai_"))
        return "th-TH";
    if (voiceId.startsWith("Polish_"))
        return "pl-PL";
    if (voiceId.startsWith("Romanian_"))
        return "ro-RO";
    if (voiceId.startsWith("Greek_") || voiceId.startsWith("greek_"))
        return "el-GR";
    if (voiceId.startsWith("Czech_") || voiceId.startsWith("czech_"))
        return "cs-CZ";
    if (voiceId.startsWith("Finnish_") || voiceId.startsWith("finnish_"))
        return "fi-FI";
    if (voiceId.startsWith("Hindi_") || voiceId.startsWith("hindi_"))
        return "hi-IN";
    if (voiceId.startsWith("Indonesian_"))
        return "id-ID";
    if (voiceId.startsWith("Vietnamese_"))
        return "vi-VN";
    return "en-US";
};
const getGenderFromVoiceId = (voiceId, voiceName) => {
    const combined = (voiceId + " " + (voiceName || "")).toLowerCase();
    const femaleKeywords = [
        "female",
        "woman",
        "girl",
        "lady",
        "queen",
        "princess",
        "heroine",
        "sister",
        "aunt",
        "wife",
        "girlfriend",
        "hostess",
        "narrator_f",
    ];
    const maleKeywords = [
        "male",
        "man",
        "boy",
        "gentleman",
        "king",
        "prince",
        "knight",
        "butler",
        "uncle",
        "husband",
        "narrator_m",
    ];
    if (femaleKeywords.some((k) => combined.includes(k)))
        return "female";
    if (maleKeywords.some((k) => combined.includes(k)))
        return "male";
    return "unknown";
};
const getTTSVoice = async (config) => {
    let apiKey = config.apiKey || "";
    let url = config.baseUrl + "/v1/get_voice";
    return new Promise((resolve, reject) => {
        axios
            .post(url, { voice_type: "all" }, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
            let systemVoices = (response.data && response.data.system_voice) || [];
            let cloningVoices = (response.data && response.data.voice_cloning) || [];
            let generationVoices = (response.data && response.data.voice_generation) || [];
            let allVoices = [
                ...systemVoices,
                ...cloningVoices,
                ...generationVoices,
            ];
            resolve(allVoices.map((voice) => ({
                name: voice.voice_id,
                gender: getGenderFromVoiceId(voice.voice_id, voice.voice_name),
                locale: getLocaleFromVoiceId(voice.voice_id),
                displayName: `MiniMax TTS - ${voice.voice_name || voice.voice_id}`,
                plugin: "minimax-tts-voice-plugin",
                config: {
                    ...config,
                    voiceName: voice.voice_id,
                },
            })));
        })
            .catch((error) => {
            reject("");
        });
    });
};

module.exports = { getAudioPath, getTTSVoice };
