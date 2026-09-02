const voice0 = require("./voice/azureTTSVoice");
const voice1 = require("./voice/amazonPollyVoice");
const voice2 = require("./voice/minimaxTTSVoice");
const voice3 = require("./voice/openaiTTSVoice");
const voice4 = require("./voice/qwenTTSVoice");
const voice5 = require("./voice/zhipuTTSVoice");
const voice6 = require("./voice/elevenlabsTTSVoice");
const voice7 = require("./voice/grokTTSVoice");
const voice8 = require("./voice/mimoTTSVoice");
const voice9 = require("./voice/volcengineTTSVoice");
const voice10 = require("./voice/multiTTSVoice");
const voice11 = require("./voice/ttsServerVoice");
const voice12 = require("./voice/chatTTSUIVoice");
const voice13 = require("./voice/chatTTSVoice");
const voice15 = require("./voice/coquiTTSVoice");
const voicePlugins = {
  "azure-tts-voice-plugin": voice0,
  "amazon-polly-voice-plugin": voice1,
  "minimax-tts-voice-plugin": voice2,
  "openai-tts-voice-plugin": voice3,
  "qwen-tts-voice-plugin": voice4,
  "zhipu-tts-voice-plugin": voice5,
  "elevenlabs-tts-voice-plugin": voice6,
  "grok-tts-voice-plugin": voice7,
  "mimo-tts-voice-plugin": voice8,
  "volcengine-tts-voice-plugin": voice9,
  "multitts-voice-plugin": voice10,
  "ttsserver-voice-plugin": voice11,
  "chatttsui-voice-plugin": voice12,
  "chattts-voice-plugin": voice13,
  "coquitts-voice-plugin": voice15,
};
const getVoicePlugin = (key) =>
  Object.prototype.hasOwnProperty.call(voicePlugins, key)
    ? voicePlugins[key]
    : undefined;
const isVoicePluginKey = (key) =>
  Object.prototype.hasOwnProperty.call(voicePlugins, key);

module.exports = { getVoicePlugin, isVoicePluginKey };
