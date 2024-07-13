const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FORMAT_CONTENT_TYPE = new Map([
  // ["riff-16khz-16bit-mono-pcm", "audio/x-wav"],
  // ["riff-24khz-16bit-mono-pcm", "audio/x-wav"],
  // ["riff-48khz-16bit-mono-pcm", "audio/x-wav"],
  // ["riff-8khz-8bit-mono-mulaw", "audio/x-wav"],
  // ["riff-8khz-8bit-mono-alaw", "audio/x-wav"],

  // ["audio-16khz-32kbitrate-mono-mp3", "audio/mpeg"],
  // ["audio-16khz-64kbitrate-mono-mp3", "audio/mpeg"],
  // ["audio-16khz-128kbitrate-mono-mp3", "audio/mpeg"],
  // ["audio-24khz-48kbitrate-mono-mp3", "audio/mpeg"],
  // ["audio-24khz-96kbitrate-mono-mp3", "audio/mpeg"],
  // ["audio-24khz-160kbitrate-mono-mp3", "audio/mpeg"],
  // ["audio-48khz-96kbitrate-mono-mp3", "audio/mpeg"],
  // ["audio-48khz-192kbitrate-mono-mp3", "audio/mpeg"],

  ["webm-16khz-16bit-mono-opus", "audio/webm"],
  ["webm-24khz-16bit-mono-opus", "audio/webm"],

  // ["ogg-16khz-16bit-mono-opus", "audio/ogg"],
  // ["ogg-24khz-16bit-mono-opus", "audio/ogg"],
  // ["ogg-48khz-16bit-mono-opus", "audio/ogg"],
]);

const FORMAT_SUFFIX = new Map([
  ["audio/x-wav", "wav"],
  ["audio/mpeg", "webm"],
  ["audio/webm", "webm"],
  ["audio/ogg", "ogg"],

]);
const getEdgeAudioPath = async (text, url, speed, dirPath) => {
  const config = getQueryParams(url)
  let audioName = new Date().getTime() + "." + (FORMAT_CONTENT_TYPE.get(config.voiceFormat) ? FORMAT_SUFFIX.get(FORMAT_CONTENT_TYPE.get(config.voiceFormat) || "audio/webm") : "webm");
  console.log(config, config.voiceFormat, FORMAT_CONTENT_TYPE.get(config.voiceFormat), FORMAT_SUFFIX.get(FORMAT_CONTENT_TYPE.get(config.voiceFormat) || "audio/webm"), "webm")
  console.log(new Date().getTime(), audioName, 'audioName')
  if (!fs.existsSync(path.join(dirPath, "tts"))) {
    fs.mkdirSync(path.join(dirPath, "tts"));
    fs.writeFileSync(path.join(dirPath, "tts", audioName), await getEdgeAudio(text, url, speed));
    console.log("文件夹创建成功");
  } else {
    fs.writeFileSync(path.join(dirPath, "tts", audioName), await getEdgeAudio(text, url, speed));
    console.log("文件夹已存在");
  }
  return path.join(dirPath, "tts", audioName);
}
const getEdgeAudio = async (text, url, speed) => {
  const config = getQueryParams(url);
  const format = FORMAT_CONTENT_TYPE.get(config.voiceFormat) ? config.voiceFormat : "webm-24khz-16bit-mono-opus";
  let headers = { 'Content-Type': 'text/plain' };
  let ssml = createSSML(text, config.voiceName || 'zh-CN-XiaoxiaoNeural', speed);
  if (config.token) {
    headers['Authorization'] = 'Bearer ' + config.token;
  }
  headers['Format'] = format;
  return new Promise((resolve, reject) => {
    axios.post(config.api, ssml, {
      headers: headers,
      responseType: 'arraybuffer'
    })
      .then(response => {
        console.log(response)
        if (response.status == 200) {
          resolve(response.data)
        } else if (response.status == 401) {
          reject('无效的密钥');
        } else {
          resolve(response.text().then(text => Promise.reject(text)))
        }
      })
      .catch(error => {
        reject(error);
      });
  })


}
const getQueryParams = (url) => {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  const queryParams = {};
  for (let pair of params.entries()) {
    queryParams[pair[0]] = pair[1];
  }
  return queryParams;
}
const createSSML = (text, voiceName, speed) => {
  text = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\'', '&apos;').replaceAll('"', '&quot;');
  let ssml = '\
    <speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">\
        <voice name="' + voiceName + '">\
            <prosody rate="' + speed + '%" pitch="0%">\
                ' + text + '\
            </prosody>\
        </voice>\
    </speak>';
  return ssml;
}

const getChatTtsAudioPath = async (text, url) => {
  const config = getQueryParams(url)
  url = url.split('?')[0];
  let prompt = config.prompt;
  let voice = config.voice || "3333";
  let temperature = parseFloat(config.temperature) || 0.3;
  let top_p = parseFloat(config.top_p) || 0.7;
  let top_k = parseInt(config.top_k) || 20;
  let skip_refine = parseInt(config.skip_refine) || 0;
  let custom_voice = parseInt(config.custom_voice) || 0;
  const qs = require("qs");
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
        console.log(response)
        if (response.data.code == 0) {
          resolve(response.data.audio_files[0].filename);
        } else {
          resolve("")
        }
      })
      .catch(error => {
        console.log(error)
        reject("");
      });
  })
}
module.exports = { getEdgeAudioPath, getChatTtsAudioPath };
