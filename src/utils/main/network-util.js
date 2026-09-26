const buildProxyUrl = (config) => {
  const authentication =
    config.username || config.password
      ? `${encodeURIComponent(config.username || "")}:${encodeURIComponent(config.password || "")}@`
      : "";
  const portNumber = parseInt(config.port);
  return config.type === "socks5"
    ? `socks5://${authentication}${config.host}:${portNumber}`
    : `http://${authentication}${config.host}:${portNumber}`;
};

const checkCloudUrl = (url) => {
  const https = require("https");
  const http = require("http");
  const { URL } = require("url");
  return new Promise((resolve) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return resolve({ ok: false, reason: "invalid_url", detail: e.message });
    }
    const isHttps = parsedUrl.protocol === "https:";
    const lib = isHttps ? https : http;
    const port = parsedUrl.port
      ? parseInt(parsedUrl.port)
      : isHttps
        ? 443
        : 80;
    const options = {
      hostname: parsedUrl.hostname,
      port,
      path: parsedUrl.pathname || "/",
      method: "HEAD",
      timeout: 8000,
      rejectUnauthorized: true,
    };
    const req = lib.request(options, (res) => {
      resolve({
        ok: true,
        status: res.statusCode,
        detail: `HTTP ${res.statusCode}`,
      });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({
        ok: false,
        reason: "timeout",
        detail: `Connection to ${parsedUrl.hostname}:${port} timed out after 8s`,
      });
    });
    req.on("error", (err) => {
      let reason = "unknown";
      if (err.code === "ENOTFOUND") {
        reason = "dns_failed";
      } else if (err.code === "ECONNREFUSED") {
        reason = "connection_refused";
      } else if (err.code === "ECONNRESET") {
        reason = "connection_reset";
      } else if (err.code === "ETIMEDOUT") {
        reason = "timeout";
      } else if (
        err.code === "CERT_HAS_EXPIRED" ||
        err.code === "ERR_TLS_CERT_ALTNAME_INVALID" ||
        err.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
      ) {
        reason = "ssl_error";
      } else if (err.message && err.message.includes("SSL")) {
        reason = "ssl_error";
      }
      resolve({
        ok: false,
        reason,
        code: err.code || "",
        detail: err.message,
      });
    });
    req.end();
  });
};

const testProxyConnection = (config) => {
  const https = require("https");
  const { URL } = require("url");
  const proxyConfig = config || {};
  const validTypes = ["http", "socks5"];
  if (!validTypes.includes(proxyConfig.type)) {
    return { ok: false, reason: "invalid_input", detail: "unsupported type" };
  }
  if (
    !proxyConfig.host ||
    typeof proxyConfig.host !== "string" ||
    proxyConfig.host.includes("://")
  ) {
    return { ok: false, reason: "invalid_input", detail: "invalid host" };
  }
  const portNumber = parseInt(proxyConfig.port);
  if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
    return { ok: false, reason: "invalid_input", detail: "invalid port" };
  }
  const proxyUrl = buildProxyUrl(proxyConfig);
  let agent;
  try {
    if (proxyConfig.type === "socks5") {
      const { SocksProxyAgent } = require("socks-proxy-agent");
      agent = new SocksProxyAgent(proxyUrl);
    } else {
      const { HttpsProxyAgent } = require("https-proxy-agent");
      agent = new HttpsProxyAgent(proxyUrl);
    }
  } catch (error) {
    return { ok: false, reason: "agent_init_failed", detail: error.message };
  }
  const target = new URL("https://www.google.com/");
  const startTime = Date.now();
  return new Promise((resolve) => {
    const options = {
      hostname: target.hostname,
      port: 443,
      path: "/",
      method: "HEAD",
      timeout: 10000,
      agent,
      rejectUnauthorized: true,
    };
    const request = https.request(options, (response) => {
      const elapsedMs = Date.now() - startTime;
      if (response.statusCode === 407) {
        return resolve({
          ok: false,
          reason: "proxy_auth_failed",
          status: 407,
          elapsedMs,
          detail: `HTTP 407 Proxy Authentication Required`,
        });
      }
      resolve({
        ok:
          response.statusCode &&
          response.statusCode >= 200 &&
          response.statusCode < 400,
        status: response.statusCode,
        elapsedMs,
        detail: `HTTP ${response.statusCode}`,
      });
    });
    request.on("timeout", () => {
      request.destroy();
      resolve({
        ok: false,
        reason: "timeout",
        elapsedMs: Date.now() - startTime,
        detail: `Connection to ${target.hostname} timed out after 10s`,
      });
    });
    request.on("error", (error) => {
      let reason = "unknown";
      if (error.code === "ENOTFOUND") {
        reason = "dns_failed";
      } else if (error.code === "ECONNREFUSED") {
        reason = "connection_refused";
      } else if (error.code === "ECONNRESET") {
        reason = "connection_reset";
      } else if (error.code === "ETIMEDOUT") {
        reason = "timeout";
      } else if (error.code === "EPROTO") {
        reason = "ssl_error";
      } else if (
        error.code === "CERT_HAS_EXPIRED" ||
        error.code === "ERR_TLS_CERT_ALTNAME_INVALID" ||
        error.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
      ) {
        reason = "ssl_error";
      } else if (error.message && error.message.includes("SSL")) {
        reason = "ssl_error";
      }
      resolve({
        ok: false,
        reason,
        code: error.code || "",
        elapsedMs: Date.now() - startTime,
        detail: error.message,
      });
    });
    request.end();
  });
};

module.exports = { buildProxyUrl, checkCloudUrl, testProxyConnection };
