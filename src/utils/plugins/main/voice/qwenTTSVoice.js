const path = require("path");
const fs = require("fs");
const axios = require("axios");
const getAudioPath = async (text, speed, dirPath, config) => {
    let audioName = new Date().getTime() + ".wav";
    if (!fs.existsSync(path.join(dirPath, "tts"))) {
        fs.mkdirSync(path.join(dirPath, "tts"));
    }
    const audioData = await getTTSAudio(text, speed, config);
    fs.writeFileSync(path.join(dirPath, "tts", audioName), audioData);
    return path.join(dirPath, "tts", audioName);
};
const getTTSAudio = async (text, speed, config) => {
    let apiKey = config.apiKey || "";
    let model = config.model || "qwen3-tts-flash";
    let voice = config.voiceName || "Cherry";
    let baseUrl = config.baseUrl || "https://dashscope.aliyuncs.com/api/v1";
    // Build request body
    const body = {
        model: model,
        input: {
            text: text,
            voice: voice,
        },
        parameters: {
            stream: false,
            speech_rate: undefined,
        },
    };
    // speed: 1.0 = normal; map to speech_rate (-500 ~ 500), 0 = normal
    if (speed && speed !== 1.0) {
        body.parameters.speech_rate = Math.round((speed - 1) * 500);
    }
    const url = `${baseUrl}/services/aigc/multimodal-generation/generation`;
    return new Promise((resolve, reject) => {
        axios
            .post(url, body, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "X-DashScope-DataInspection": "enable",
            },
        })
            .then(async (response) => {
            const audioUrl = response.data &&
                response.data.output &&
                response.data.output.audio &&
                response.data.output.audio.url;
            if (!audioUrl) {
                reject("No audio URL in response");
                return;
            }
            // Download the audio file from the returned URL
            const audioResponse = await axios.get(audioUrl, {
                responseType: "arraybuffer",
            });
            resolve(Buffer.from(audioResponse.data));
        })
            .catch((error) => {
            reject("");
        });
    });
};
const getTTSVoice = async (config) => {
    // Qwen TTS uses a fixed set of system voices; return a predefined list
    const voices = [
        {
            name: "Cherry",
            gender: "female",
            locale: "zh-CN",
            displayName: "芊悦 Cherry (zh-CN/en) - Female",
        },
        {
            name: "Serena",
            gender: "female",
            locale: "zh-CN",
            displayName: "苏瑶 Serena (zh-CN/en) - Female",
        },
        {
            name: "Ethan",
            gender: "male",
            locale: "zh-CN",
            displayName: "晨煦 Ethan (zh-CN/en) - Male",
        },
        {
            name: "Chelsie",
            gender: "female",
            locale: "zh-CN",
            displayName: "千雪 Chelsie (zh-CN/en) - Female",
        },
        {
            name: "Momo",
            gender: "female",
            locale: "zh-CN",
            displayName: "茉兔 Momo (zh-CN/en) - Female",
        },
        {
            name: "Vivian",
            gender: "female",
            locale: "zh-CN",
            displayName: "十三 Vivian (zh-CN/en) - Female",
        },
        {
            name: "Moon",
            gender: "male",
            locale: "zh-CN",
            displayName: "月白 Moon (zh-CN/en) - Male",
        },
        {
            name: "Maia",
            gender: "female",
            locale: "zh-CN",
            displayName: "四月 Maia (zh-CN/en) - Female",
        },
        {
            name: "Kai",
            gender: "male",
            locale: "zh-CN",
            displayName: "凯 Kai (zh-CN/en) - Male",
        },
        {
            name: "Nofish",
            gender: "male",
            locale: "zh-CN",
            displayName: "不吃鱼 Nofish (zh-CN/en) - Male",
        },
        {
            name: "Bella",
            gender: "female",
            locale: "zh-CN",
            displayName: "萌宝 Bella (zh-CN/en) - Female",
        },
        {
            name: "Jennifer",
            gender: "female",
            locale: "zh-CN",
            displayName: "詹妮弗 Jennifer (zh-CN/en) - Female",
        },
        {
            name: "Ryan",
            gender: "male",
            locale: "zh-CN",
            displayName: "甜茶 Ryan (zh-CN/en) - Male",
        },
        {
            name: "Katerina",
            gender: "female",
            locale: "zh-CN",
            displayName: "卡捷琳娜 Katerina (zh-CN/en) - Female",
        },
        {
            name: "Aiden",
            gender: "male",
            locale: "zh-CN",
            displayName: "艾登 Aiden (zh-CN/en) - Male",
        },
        {
            name: "Neil",
            gender: "male",
            locale: "zh-CN",
            displayName: "阿闻 Neil (zh-CN/en) - Male",
        },
        {
            name: "Elias",
            gender: "female",
            locale: "zh-CN",
            displayName: "墨讲师 Elias (zh-CN/en) - Female",
        },
        {
            name: "Sunny",
            gender: "female",
            locale: "zh-SC",
            displayName: "四川-晴儿 Sunny (zh-SC) - Female",
        },
        {
            name: "Dylan",
            gender: "male",
            locale: "zh-BJ",
            displayName: "北京-晓东 Dylan (zh-BJ) - Male",
        },
        {
            name: "Jada",
            gender: "female",
            locale: "zh-SH",
            displayName: "上海-阿珍 Jada (zh-SH) - Female",
        },
        {
            name: "Rocky",
            gender: "male",
            locale: "zh-YUE",
            displayName: "粤语-阿强 Rocky (zh-YUE) - Male",
        },
        {
            name: "Kiki",
            gender: "female",
            locale: "zh-YUE",
            displayName: "粤语-阿清 Kiki (zh-YUE) - Female",
        },
    ];
    return voices.map((v) => ({
        name: v.name,
        gender: v.gender,
        locale: v.locale,
        displayName: `Qwen TTS - ${v.displayName}`,
        plugin: "qwen-tts-voice-plugin",
        config: {
            ...config,
            voiceName: v.name,
        },
    }));
};

module.exports = { getAudioPath, getTTSVoice };
