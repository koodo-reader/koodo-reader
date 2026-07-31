const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
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
// AWS Signature Version 4 signing helpers
const getSignatureKey = (crypto, key, dateStamp, regionName, serviceName) => {
    const kDate = crypto
        .createHmac("sha256", "AWS4" + key)
        .update(dateStamp)
        .digest();
    const kRegion = crypto
        .createHmac("sha256", kDate)
        .update(regionName)
        .digest();
    const kService = crypto
        .createHmac("sha256", kRegion)
        .update(serviceName)
        .digest();
    const kSigning = crypto
        .createHmac("sha256", kService)
        .update("aws4_request")
        .digest();
    return kSigning;
};
const getAmzDateTime = () => {
    const now = new Date();
    const amzDate = now
        .toISOString()
        .replace(/[:\-]|\.\d{3}/g, "")
        .slice(0, 15) + "Z";
    const dateStamp = amzDate.slice(0, 8);
    return { amzDate, dateStamp };
};
const getTTSAudio = async (text, speed, config) => {
    let region = config.region || "us-east-1";
    let accessKeyId = config.accessKeyId || "";
    let secretAccessKey = config.secretAccessKey || "";
    let voiceId = config.voiceId || "Joanna";
    let engine = config.engine || "neural";
    // speed is a multiplier: 1.0 = normal, e.g. 0.5 = slow, 2.0 = fast
    // Amazon Polly SSML rate accepts: x-slow, slow, medium, fast, x-fast, or N%
    let rate = speed ? `${Math.round(speed * 100)}%` : "100%";
    const service = "polly";
    const host = `polly.${region}.amazonaws.com`;
    const endpoint = `https://${host}/v1/speech`;
    const method = "POST";
    const contentType = "application/json";
    const requestBody = JSON.stringify({
        Engine: engine,
        OutputFormat: "mp3",
        Text: `<speak><prosody rate="${rate}">${text}</prosody></speak>`,
        TextType: "ssml",
        VoiceId: voiceId,
    });
    const { amzDate, dateStamp } = getAmzDateTime();
    const payloadHash = crypto
        .createHash("sha256")
        .update(requestBody)
        .digest("hex");
    const canonicalHeaders = `content-type:${contentType}\n` +
        `host:${host}\n` +
        `x-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-date";
    const canonicalRequest = [
        method,
        "/v1/speech",
        "",
        canonicalHeaders,
        signedHeaders,
        payloadHash,
    ].join("\n");
    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
        algorithm,
        amzDate,
        credentialScope,
        crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");
    const signingKey = getSignatureKey(crypto, secretAccessKey, dateStamp, region, service);
    const signature = crypto
        .createHmac("sha256", signingKey)
        .update(stringToSign)
        .digest("hex");
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${signature}`;
    return new Promise((resolve, reject) => {
        axios
            .post(endpoint, requestBody, {
            headers: {
                "Content-Type": contentType,
                "X-Amz-Date": amzDate,
                Authorization: authorizationHeader,
            },
            responseType: "arraybuffer",
        })
            .then((response) => {
            resolve(response.data);
        })
            .catch((error) => {
            reject("");
        });
    });
};
const getTTSVoice = async (config) => {
    let region = config.region || "us-east-1";
    let accessKeyId = config.accessKeyId || "";
    let secretAccessKey = config.secretAccessKey || "";
    const service = "polly";
    const host = `polly.${region}.amazonaws.com`;
    const method = "GET";
    const path = "/v1/voices";
    const queryString = "Engine=neural";
    const { amzDate, dateStamp } = getAmzDateTime();
    const payloadHash = crypto.createHash("sha256").update("").digest("hex");
    const canonicalHeaders = `host:${host}\n` + `x-amz-date:${amzDate}\n`;
    const signedHeaders = "host;x-amz-date";
    const canonicalRequest = [
        method,
        path,
        queryString,
        canonicalHeaders,
        signedHeaders,
        payloadHash,
    ].join("\n");
    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
        algorithm,
        amzDate,
        credentialScope,
        crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");
    const signingKey = getSignatureKey(crypto, secretAccessKey, dateStamp, region, service);
    const signature = crypto
        .createHmac("sha256", signingKey)
        .update(stringToSign)
        .digest("hex");
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${signature}`;
    const url = `https://${host}${path}?${queryString}`;
    return new Promise((resolve, reject) => {
        axios
            .get(url, {
            headers: {
                "X-Amz-Date": amzDate,
                Authorization: authorizationHeader,
            },
        })
            .then((response) => {
            let voices = response.data.Voices;
            resolve(voices.map((voice) => {
                return {
                    name: voice.Id,
                    gender: voice.Gender.toLowerCase(),
                    locale: voice.LanguageCode,
                    displayName: `Amazon Polly - ${voice.Name} (${voice.LanguageCode}) - ${voice.Gender}`,
                    plugin: "amazon-polly-voice-plugin",
                    config: {
                        ...config,
                        voiceId: voice.Id,
                        engine: (voice.SupportedEngines || []).includes("neural")
                            ? "neural"
                            : "standard",
                    },
                };
            }));
        })
            .catch((error) => {
            reject("");
        });
    });
};

module.exports = { getAudioPath, getTTSVoice };
