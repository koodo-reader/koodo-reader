const azureTTSVoice = require("./voice/azureTTSVoice");
const amazonPollyVoice = require("./voice/amazonPollyVoice");
const minimaxTTSVoice = require("./voice/minimaxTTSVoice");
const openaiTTSVoice = require("./voice/openaiTTSVoice");
const qwenTTSVoice = require("./voice/qwenTTSVoice");
const zhipuTTSVoice = require("./voice/zhipuTTSVoice");
const elevenlabsTTSVoice = require("./voice/elevenlabsTTSVoice");
const grokTTSVoice = require("./voice/grokTTSVoice");
const mimoTTSVoice = require("./voice/mimoTTSVoice");
const volcengineTTSVoice = require("./voice/volcengineTTSVoice");
const multiTTSVoice = require("./voice/multiTTSVoice");
const ttsServerVoice = require("./voice/ttsServerVoice");
const chatTTSUIVoice = require("./voice/chatTTSUIVoice");
const chatTTSVoice = require("./voice/chatTTSVoice");
const coquiTTSVoice = require("./voice/coquiTTSVoice");

const voicePlugins = {
  "azure-tts-voice-plugin": azureTTSVoice,
  "amazon-polly-voice-plugin": amazonPollyVoice,
  "minimax-tts-voice-plugin": minimaxTTSVoice,
  "openai-tts-voice-plugin": openaiTTSVoice,
  "qwen-tts-voice-plugin": qwenTTSVoice,
  "zhipu-tts-voice-plugin": zhipuTTSVoice,
  "elevenlabs-tts-voice-plugin": elevenlabsTTSVoice,
  "grok-tts-voice-plugin": grokTTSVoice,
  "mimo-tts-voice-plugin": mimoTTSVoice,
  "volcengine-tts-voice-plugin": volcengineTTSVoice,
  "multitts-voice-plugin": multiTTSVoice,
  "ttsserver-voice-plugin": ttsServerVoice,
  "chatttsui-voice-plugin": chatTTSUIVoice,
  "chattts-voice-plugin": chatTTSVoice,
  "coquitts-voice-plugin": coquiTTSVoice,
};

const getVoicePlugin = (key) =>
  Object.prototype.hasOwnProperty.call(voicePlugins, key)
    ? voicePlugins[key]
    : undefined;
const isVoicePluginKey = (key) =>
  Object.prototype.hasOwnProperty.call(voicePlugins, key);

module.exports = { getVoicePlugin, isVoicePluginKey };
