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
        axios.get(url + "?" + objectToQueryString({
            text,
            speaker_id,
            language_id,
            style_wav
        }), { responseType: "arraybuffer" })
            .then(response => {
            resolve(response.data);
        })
            .catch(error => {
            reject("");
        });
    });
};

module.exports = { getAudioPath };
