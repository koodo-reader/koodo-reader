const axios = require("axios");
const qs = require("qs");
const getAudioPath = async (text, speed, dirPath, config) => {
    let url = config.url || "http://127.0.0.1:9966/tts";
    let prompt = config.prompt || "";
    let voice = config.voice || "3333";
    let temperature = config.temperature || 0.3;
    let top_p = config.top_p || 0.7;
    let top_k = config.top_k || 20;
    let skip_refine = config.skip_refine || 0;
    let custom_voice = config.custom_voice || 0;
    return new Promise((resolve, reject) => {
        axios.post(url, qs.stringify({
            text: text,
            prompt: prompt,
            voice: voice,
            temperature: temperature,
            top_p: top_p,
            top_k: top_k,
            skip_refine: skip_refine,
            custom_voice: custom_voice
        }))
            .then(response => {
            if (response.data.code == 0) {
                resolve(response.data.audio_files[0].filename);
            }
            else {
                resolve("");
            }
        })
            .catch(error => {
            reject("");
        });
    });
};

module.exports = { getAudioPath };
