const path = require("path");
const fs = require("fs");
const axios = require("axios");
const AdmZip = require("adm-zip");
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
    let url = config.url || "http://127.0.0.1:8000/generate_voice";
    // main infer params
    const body = config.body;
    // refine text params
    const params_refine_text = config.params_refine_text;
    // Add params_refine_text to body
    body.params_refine_text = params_refine_text;
    // infer code params
    const params_infer_code = config.params_infer_code;
    // Add params_infer_code to body
    body.params_infer_code = params_infer_code;
    body.text = [text];
    body.stream = false;
    return new Promise((resolve, reject) => {
        axios.post(url, body, { responseType: "arraybuffer" })
            .then(response => {
            var zip = new AdmZip(response.data);
            var zipEntries = zip.getEntries();
            resolve(zipEntries[0].getData());
        })
            .catch(error => {
            reject("");
        });
    });
};

module.exports = { getAudioPath };
