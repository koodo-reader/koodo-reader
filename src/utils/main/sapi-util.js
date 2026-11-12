// SAPI 5 工具：PowerShell 脚本、worker 进程、音色枚举与 WAV 合成。
// 仅主进程使用；插件层只依赖 listVoices / synthesizeToWaveFile。
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// 仅 Electron 主进程可用；在 Vitest 等纯 Node 环境下 require("electron") 返回二进制路径
let electronApp = null;
try {
  const electron = require("electron");
  electronApp = electron && electron.app ? electron.app : null;
} catch (error) {
  electronApp = null;
}

// 写入磁盘后由 powershell.exe -File 执行。
// 只通过 stdin/stdout 的 JSON Lines 通信，避免把书籍文本拼进命令行。
const WORKER_SCRIPT = `$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$stdin = New-Object System.IO.StreamReader([Console]::OpenStandardInput(), $utf8)
$stdout = New-Object System.IO.StreamWriter([Console]::OpenStandardOutput(), $utf8)
$stdout.AutoFlush = $true

$assemblyError = $null
try {
  Add-Type -AssemblyName System.Speech
} catch {
  $assemblyError = $_.Exception.Message
}

function Send-Response($response) {
  $stdout.WriteLine(($response | ConvertTo-Json -Compress -Depth 6))
}

$shouldExit = $false
while (-not $shouldExit) {
  $line = $stdin.ReadLine()
  if ($null -eq $line) { break }
  if ([string]::IsNullOrWhiteSpace($line)) { continue }

  $request = $null
  $response = @{ ok = $false; error = 'INVALID_REQUEST' }
  try {
    $request = $line | ConvertFrom-Json
    $response.id = $request.id
    if ($assemblyError) { throw $assemblyError }

    if ($request.cmd -eq 'list') {
      $descriptions = @{}
      try {
        $comVoice = New-Object -ComObject SAPI.SpVoice
        foreach ($token in $comVoice.GetVoices()) {
          try {
            $tokenName = [string]$token.GetAttribute('Name')
            if ($tokenName) {
              $descriptions[$tokenName] = [string]$token.GetDescription()
            }
          } catch {}
        }
      } catch {}
      $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
      try {
        $voices = New-Object System.Collections.ArrayList
        foreach ($installed in $synth.GetInstalledVoices()) {
          $info = $installed.VoiceInfo
          $displayName = ''
          if ($descriptions.ContainsKey([string]$info.Name)) {
            $displayName = [string]$descriptions[[string]$info.Name]
          }
          [void]$voices.Add([pscustomobject]@{
            name = $info.Name
            displayName = $displayName
            id = $info.Id
            culture = $info.Culture.Name
            gender = $info.Gender.ToString()
            enabled = $installed.Enabled
          })
        }
        $response.ok = $true
        $response.voices = @($voices)
      } finally {
        $synth.Dispose()
      }
    } elseif ($request.cmd -eq 'speak') {
      $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
      try {
        $matched = $null
        foreach ($installed in $synth.GetInstalledVoices()) {
          if ($installed.Enabled -and $installed.VoiceInfo.Name -eq [string]$request.voice) {
            $matched = $installed
            break
          }
        }
        if ($null -eq $matched) { throw 'VOICE_NOT_FOUND' }
        $synth.SelectVoice($matched.VoiceInfo.Name)
        $synth.Rate = [int]$request.rate
        $synth.SetOutputToWaveFile([string]$request.out)
        $synth.Speak([string]$request.text)
        $response.ok = $true
      } finally {
        try { $synth.SetOutputToNull() } catch {}
        $synth.Dispose()
      }
    } elseif ($request.cmd -eq 'exit') {
      $response.ok = $true
      $shouldExit = $true
    } else {
      $response.error = 'UNKNOWN_COMMAND'
    }
  } catch {
    $response.ok = $false
    $response.error = $_.Exception.Message
  }
  Send-Response $response
}
`;

const ADAPTER_VOICE_ID_PREFIXES = ["Local-", "MicrosoftWindows.Voice."];
const LIST_TIMEOUT = 20000;
const SPEAK_TIMEOUT = 60000;
const IDLE_TIMEOUT = 90000;

// ---------- 纯函数 ----------

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// SAPI 的 Rate 是 -10..10 的对数刻度（每级约 x1.129），
// 这里与 Firefox SapiService 的换算保持一致，输入为 0.5-2 的倍率。
const toSapiRate = (speed) => {
  const value = Number(speed);
  if (!Number.isFinite(value) || value <= 0 || value === 1) {
    return 0;
  }
  return clamp(
    Math.round((10 * Math.log10(value)) / Math.log10(3)),
    -10,
    10
  );
};

const normalizeGender = (gender) => {
  const value = typeof gender === "string" ? gender.toLowerCase() : "";
  return value === "male" || value === "female" ? value : "notset";
};

// NaturalVoiceSAPIAdapter 通过 SAPI TokenEnums 暴露的音色 id 前缀
const isAdapterVoiceId = (id) =>
  typeof id === "string" &&
  ADAPTER_VOICE_ID_PREFIXES.some((prefix) => id.startsWith(prefix));

const mapInstalledVoices = (voices, pluginKey) => {
  const seen = new Set();
  const mapped = [];
  for (const voice of Array.isArray(voices) ? voices : []) {
    if (!voice || voice.enabled === false) continue;
    const name = typeof voice.name === "string" ? voice.name.trim() : "";
    const locale =
      typeof voice.culture === "string" ? voice.culture.trim() : "";
    if (!name || !locale || seen.has(name)) continue;
    seen.add(name);
    const description =
      typeof voice.displayName === "string" ? voice.displayName.trim() : "";
    mapped.push({
      name,
      displayName: description || `${name} - ${locale}`,
      locale,
      gender: normalizeGender(voice.gender),
      plugin: pluginKey,
      config: { voiceName: name },
      adapter: isAdapterVoiceId(voice.id),
    });
  }
  return mapped
    .sort(
      (a, b) =>
        Number(b.adapter) - Number(a.adapter) ||
        a.locale.localeCompare(b.locale) ||
        a.name.localeCompare(b.name)
    )
    .map(({ adapter, ...voice }) => voice);
};

// 32 位 Electron 需要经由 Sysnative 才能启动 64 位 PowerShell，
// 否则会读到 32 位的 SAPI 注册表视图，看不到 NaturalVoiceSAPIAdapter 的音色。
const getPowerShellPath = (arch, systemRoot, existsSync = fs.existsSync) => {
  if (!systemRoot) return "powershell.exe";
  const relative = path.win32.join(
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe"
  );
  const candidates = [];
  if (arch === "ia32") {
    candidates.push(path.win32.join(systemRoot, "Sysnative", relative));
  }
  candidates.push(path.win32.join(systemRoot, "System32", relative));
  return candidates.find((candidate) => existsSync(candidate)) || "powershell.exe";
};

const getWorkerScriptPath = (userDataPath) =>
  path.win32.join(userDataPath, "natural-voice-sapi-adapter", "worker.ps1");

// PowerShell 5.1 读取无 BOM 的 UTF-8 脚本会按 ANSI 解码，中文文本会导致解析错误
const withBom = (content) => "\uFEFF" + content;

// ---------- PowerShell worker ----------

let worker = null;
let idleTimer = null;
let requestId = 0;
const pending = new Map();
let queue = Promise.resolve();

const failAll = (error) => {
  for (const entry of pending.values()) {
    clearTimeout(entry.timer);
    entry.reject(error);
  }
  pending.clear();
};

const clearIdleTimer = () => {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
};

const dispose = (error) => {
  clearIdleTimer();
  const child = worker;
  worker = null;
  if (child) {
    try {
      child.stdin.end();
    } catch (error) {
      // ignore
    }
    try {
      child.kill();
    } catch (error) {
      // ignore
    }
  }
  failAll(error instanceof Error ? error : new Error("SAPI worker stopped"));
};

const scheduleIdleShutdown = () => {
  clearIdleTimer();
  idleTimer = setTimeout(() => dispose(), IDLE_TIMEOUT);
};

const handleMessage = (message) => {
  const entry = pending.get(message.id);
  if (!entry) {
    return;
  }
  pending.delete(message.id);
  clearTimeout(entry.timer);
  entry.resolve(message);
  scheduleIdleShutdown();
};

const prepareWorkerScript = async (scriptPath) => {
  const content = withBom(WORKER_SCRIPT);
  let existing = null;
  try {
    existing = await fs.promises.readFile(scriptPath, "utf8");
  } catch (error) {
    // 文件不存在或不可读时直接重写
  }
  if (existing === content) {
    return;
  }
  await fs.promises.mkdir(path.dirname(scriptPath), { recursive: true });
  await fs.promises.writeFile(scriptPath, content, "utf8");
};

const ensureWorker = async (isExpired) => {
  if (worker && worker.exitCode === null && worker.stdin) {
    return worker;
  }
  if (!electronApp) {
    throw new Error("SAPI util is only available in the Electron main process");
  }
  const scriptPath = getWorkerScriptPath(electronApp.getPath("userData"));
  await prepareWorkerScript(scriptPath);
  if (isExpired()) {
    return null;
  }
  const powerShellPath = getPowerShellPath(
    process.arch,
    process.env.SystemRoot || process.env.windir
  );
  const child = spawn(
    powerShellPath,
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
    ],
    { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }
  );
  let stdoutBuffer = "";
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdoutBuffer += chunk;
    let index = stdoutBuffer.indexOf("\n");
    while (index >= 0) {
      const line = stdoutBuffer.slice(0, index).trim();
      stdoutBuffer = stdoutBuffer.slice(index + 1);
      if (line) {
        try {
          handleMessage(JSON.parse(line));
        } catch (error) {
          console.error("Invalid SAPI worker response:", error.message);
        }
      }
      index = stdoutBuffer.indexOf("\n");
    }
  });
  child.stderr.on("data", (chunk) => {
    console.error("SAPI worker error:", String(chunk).trim());
  });
  child.on("error", (error) => {
    if (worker !== child) {
      return;
    }
    worker = null;
    clearIdleTimer();
    failAll(error);
  });
  child.on("exit", () => {
    if (worker !== child) {
      return;
    }
    worker = null;
    clearIdleTimer();
    failAll(new Error("SAPI worker exited"));
  });
  child.stdin.on("error", (error) => {
    if (worker !== child) {
      return;
    }
    dispose(error);
  });
  worker = child;
  return child;
};

const doRequest = (payload, timeoutMs) => {
  clearIdleTimer();
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    const timer = setTimeout(() => {
      dispose(new Error("SAPI worker timed out"));
    }, timeoutMs);
    pending.set(id, {
      resolve: (message) => {
        clearTimeout(timer);
        resolve(message);
      },
      reject,
      timer,
    });
    void ensureWorker(() => !pending.has(id))
      .then((child) => {
        if (!pending.has(id)) {
          if (child && worker === child) dispose();
          return;
        }
        child.stdin.write(JSON.stringify({ ...payload, id }) + "\n", "utf8");
      })
      .catch((error) => {
        if (!pending.has(id)) return;
        dispose(error);
      });
  });
};

// SpeechSynthesizer 不是并发安全的，所有请求串行执行
const request = (payload, timeoutMs) => {
  const run = () => doRequest(payload, timeoutMs);
  const result = queue.then(run, run);
  queue = result.then(
    () => {},
    () => {}
  );
  return result;
};

if (electronApp) {
  electronApp.on("before-quit", dispose);
  electronApp.on("will-quit", dispose);
}
process.on("exit", () => {
  if (worker) {
    try {
      worker.kill();
    } catch (error) {
      // ignore
    }
  }
});

// ---------- 音色枚举与合成 ----------

// 应用运行期间复用枚举结果；重启后自动重新枚举
let rawVoices = null;
let rawVoicePromise = null;

const loadRawVoices = () => {
  if (rawVoices) {
    return Promise.resolve(rawVoices);
  }
  if (!rawVoicePromise) {
    rawVoicePromise = request({ cmd: "list" }, LIST_TIMEOUT)
      .then((response) => {
        if (!response || !response.ok) {
          throw new Error(
            (response && response.error) || "Failed to list SAPI voices"
          );
        }
        rawVoices = Array.isArray(response.voices) ? response.voices : [];
        return rawVoices;
      })
      .finally(() => {
        rawVoicePromise = null;
      });
  }
  return rawVoicePromise;
};

const listVoices = async (pluginKey) =>
  mapInstalledVoices(await loadRawVoices(), pluginKey);

const speak = (text, voiceName, rate, outPath) =>
  request(
    { cmd: "speak", text, voice: voiceName, rate, out: outPath },
    SPEAK_TIMEOUT
  );

const synthesizeToWaveFile = async ({ text, voiceName, speed, outPath }) => {
  const rate = toSapiRate(speed);
  let response = await speak(text, voiceName, rate, outPath);
  if (!response.ok && response.error === "VOICE_NOT_FOUND") {
    // 只刷新本次运行的音色缓存后重试同名音色，用于处理应用运行期间新注册的音色。
    // 若音色确实被移除，不做静默换音色，以免渲染层选中状态和缓存身份不一致。
    rawVoices = null;
    await loadRawVoices();
    response = await speak(text, voiceName, rate, outPath);
  }
  return response;
};

module.exports = {
  listVoices,
  synthesizeToWaveFile,
  _internal: {
    toSapiRate,
    mapInstalledVoices,
    getPowerShellPath,
    getWorkerScriptPath,
    withBom,
  },
};
