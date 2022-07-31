import axios from "axios";

async function getToken() {
  try {
    const result = await axios.get("https://www.bing.com/translator");
    const iidMatch = /data-iid="(.+?)"/.exec(result.data);
    const igMatch = /IG:"(.+?)"/.exec(result.data);
    if (!iidMatch || !igMatch) {
      throw new Error("Can't get Token");
    }

    var data = {
      iid: iidMatch[1],
      ig: igMatch[1],
    };

    return data;
  } catch (error) {
    console.log(error);
  }
}

async function getVoiceToken({ ig, iid }) {
  try {
    console.log(iid);
    const url = `https://www.bing.com/tfetspktok?isVertical=1&IG=${ig}&IID=${iid}`;
    const result = await axios.post(url);
    return result.data;
  } catch (error) {
    console.log(error);
  }
}

export async function getVoiceSpeech(text) {
  try {
    const data: any = await getToken();
    const tokenData = await getVoiceToken(data);
    const xmlBody =
      "<speak version='1.0' xml:lang='vi-VN'><voice xml:lang='vi-VN' xml:gender='Male' name='vi-VN-An'><prosody rate='-20.00%'>" +
      text +
      "</prosody></voice></speak>";
    const config = {
      headers: {
        authorization: "Bearer " + tokenData.token,
        "Content-Type": "application/ssml+xml",
        "x-microsoft-outputformat": "audio-16khz-32kbitrate-mono-mp3",
      },
    };
    console.log(config);
    const result = await axios.post(
      "https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1",
      xmlBody,
      config
    );
    return result.data;
  } catch (error) {
    console.log(error);
  }
}
