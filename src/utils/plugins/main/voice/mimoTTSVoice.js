const path = require("path");
const fs = require("fs");
const axios = require("axios");
const getAudioPath = async (text, speed, dirPath, config) => {
    let audioName = new Date().getTime() + ".wav";
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
    let voiceName = config.voiceName || "mimo_default";
    let url = "https://api.xiaomimimo.com/v1/chat/completions";
    return new Promise((resolve, reject) => {
        axios
            .post(url, {
            model: "mimo-v2.5-tts",
            messages: [
                {
                    role: "assistant",
                    content: text,
                },
            ],
            audio: {
                format: "mp3",
                voice: voiceName,
            },
        }, {
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
            let audioData = response.data.choices[0].message.audio.data;
            let audioBuffer = Buffer.from(audioData, "base64");
            resolve(audioBuffer);
        })
            .catch((error) => {
            reject("");
        });
    });
};
const getTTSVoice = async (config) => {
    const voices = [
        {
            name: "mimo_default",
            displayName: "MiMo Default",
            gender: "female",
            locale: "zh-CN",
        },
        {
            name: "冰糖",
            displayName: "冰糖 (Bingtang) - Female",
            gender: "female",
            locale: "zh-CN",
        },
        {
            name: "茉莉",
            displayName: "茉莉 (Moli) - Female",
            gender: "female",
            locale: "zh-CN",
        },
        {
            name: "苏打",
            displayName: "苏打 (Suda) - Male",
            gender: "male",
            locale: "zh-CN",
        },
        {
            name: "白桦",
            displayName: "白桦 (Baihua)- Male",
            gender: "male",
            locale: "zh-CN",
        },
        {
            name: "Mia",
            displayName: "Mia - Female",
            gender: "female",
            locale: "en-US",
        },
        {
            name: "Chloe",
            displayName: "Chloe - Female",
            gender: "female",
            locale: "en-US",
        },
        {
            name: "Milo",
            displayName: "Milo - Male",
            gender: "male",
            locale: "en-US",
        },
        {
            name: "Dean",
            displayName: "Dean - Male",
            gender: "male",
            locale: "en-US",
        },
    ];
    return Promise.resolve(voices.map((voice) => ({
        name: voice.name,
        gender: voice.gender,
        locale: voice.locale,
        displayName: `MiMo TTS - ${voice.displayName} (${voice.locale})`,
        plugin: "mimo-tts-voice-plugin",
        config: {
            ...config,
            voiceName: voice.name,
        },
    })));
};

module.exports = { getAudioPath, getTTSVoice };
