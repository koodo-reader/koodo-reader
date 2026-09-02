const { contextBridge, ipcRenderer } = require("electron");

const INVOKE_CHANNELS = new Set([
  "cancel-download-app",
  "discord-rpc-update",
  "discord-rpc-clear",
  "update-win-app",
  "open-book",
  "generate-tts",
  "get-tts-voices",
  "cloud-upload",
  "cloud-download",
  "cloud-progress",
  "picker-download",
  "picker-progress",
  "cloud-reset",
  "cloud-stats",
  "cloud-delete",
  "cloud-list",
  "picker-list",
  "cloud-exist",
  "cloud-close",
  "clear-tts",
  "select-path",
  "select-file",
  "encrypt-data",
  "decrypt-data",
  "check-cloud-url",
  "get-proxy-config",
  "set-proxy-config",
  "test-proxy-connection",
  "get-mac",
  "get-device-name",
  "get-biometric-capability",
  "prompt-biometric-auth",
  "reset-reader-position",
  "reset-main-position",
  "select-zip-file",
  "select-book",
  "custom-database-command",
  "database-command",
  "close-database",
  "set-always-on-top",
  "set-auto-maximize",
  "toggle-auto-launch",
  "toggle-minimize-to-tray",
  "open-explorer-folder",
  "get-debug-logs",
  "hide-reader",
  "open-console",
  "reload-reader",
  "reload-main",
  "new-chat",
  "clear-all-data",
  "new-tab",
  "reload-tab",
  "adjust-tab-size",
  "exit-tab",
  "enter-tab-fullscreen",
  "exit-tab-fullscreen",
  "enter-fullscreen",
  "exit-fullscreen",
  "open-url",
  "switch-moyu",
  "set-native-theme-source",
  "system-ocr",
  "file-command",
  "open-external",
  "dict-lookup",
  "partial-md5",
  "crypto-file-md5",
  "backup-path",
  "restore-path",
]);
const SEND_CHANNELS = new Set(["reader-close-ready", "tab-close-ready"]);
const SEND_SYNC_CHANNELS = new Set([
  "storage-location",
  "url-window-status",
  "get-dirname",
  "system-color",
  "get-file-data",
  "check-file-data",
  "user-data",
  "file-command-sync",
  "clipboard-read-text-sync",
]);
const EVENT_CHANNELS = new Set([
  "oauth-callback",
  "before-reader-close",
  "before-tab-close",
  "reading-finished",
  "chat-message",
  "import-url-from-link",
  "open-book-from-link",
  "open-note-from-link",
  "picker-finished",
  "download-app-progress",
  "backup-progress",
  "restore-progress",
]);

const assertChannel = (set, channel) => {
  if (!set.has(channel))
    throw new Error(`IPC channel is not allowed: ${channel}`);
};
const invoke = (channel, ...args) => {
  assertChannel(INVOKE_CHANNELS, channel);
  return ipcRenderer.invoke(channel, ...args);
};
const send = (channel, ...args) => {
  assertChannel(SEND_CHANNELS, channel);
  return ipcRenderer.send(channel, ...args);
};
const sendSync = (channel, ...args) => {
  assertChannel(SEND_SYNC_CHANNELS, channel);
  return ipcRenderer.sendSync(channel, ...args);
};

const eventHandlers = new Map();
const listen = (channel, listener, once = false) => {
  assertChannel(EVENT_CHANNELS, channel);
  const handler = (_event, payload) => {
    if (once) removeListener(channel, listener, handler);
    listener(payload);
  };
  const handlers = eventHandlers.get(channel) || new Map();
  const listeners = handlers.get(listener) || [];
  listeners.push(handler);
  handlers.set(listener, listeners);
  eventHandlers.set(channel, handlers);
  ipcRenderer[once ? "once" : "on"](channel, handler);
  return () => removeListener(channel, listener, handler);
};
const removeListener = (channel, listener, handler) => {
  assertChannel(EVENT_CHANNELS, channel);
  const handlers = eventHandlers.get(channel);
  const listeners = handlers && handlers.get(listener);
  const target = handler || (listeners && listeners[listeners.length - 1]);
  if (target) {
    ipcRenderer.removeListener(channel, target);
    if (listeners) {
      const index = listeners.indexOf(target);
      if (index >= 0) listeners.splice(index, 1);
      if (listeners.length === 0) handlers.delete(listener);
    }
  }
};

const fileArgs = (args) => (args && typeof args === "object" ? args : {});
const fileSync = (operation, args) => {
  const result = sendSync("file-command-sync", {
    operation,
    ...fileArgs(args),
  });
  if (!result || result.ok !== true) {
    const error = new Error(result?.error?.message || "File command failed");
    if (result?.error?.code) error.code = result.error.code;
    throw error;
  }
  return result.value;
};
const fileInvoke = (operation, args) =>
  invoke("file-command", { operation, ...fileArgs(args) });
const bytes = (value) => {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value))
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  return value;
};
const callbackResult = (promise, callback) => {
  promise
    .then((value) => callback(null, bytes(value)))
    .catch((error) => callback(error));
};

const file = {
  existsSync: (filePath) => fileSync("exists", { path: filePath }),
  mkdirSync: (filePath, options) =>
    fileSync("mkdir", { path: filePath, options }),
  writeFileSync: (filePath, data, options) =>
    fileSync("write", { path: filePath, data: bytes(data), options }),
  appendFileSync: (filePath, data, options) =>
    fileSync("append", { path: filePath, data: bytes(data), options }),
  readFileSync: (filePath, options) =>
    bytes(fileSync("read", { path: filePath, options })),
  readdirSync: (filePath, options) =>
    fileSync("readdir", { path: filePath, options }),
  statSync: (filePath) => fileSync("stat", { path: filePath }),
  unlinkSync: (filePath) => fileSync("unlink", { path: filePath }),
  copyFileSync: (source, destination) =>
    fileSync("copyFile", { source, destination }),
  renameSync: (source, destination) =>
    fileSync("rename", { source, destination }),
  rmSync: (filePath, options) => fileSync("rm", { path: filePath, options }),
  emptyDirSync: (filePath) => fileSync("emptyDir", { path: filePath }),
  copy: (source, destination) => fileInvoke("copy", { source, destination }),
  rm: (filePath, options) => fileInvoke("rm", { path: filePath, options }),
  readFile: (filePath, options, callback) => {
    const cb = typeof options === "function" ? options : callback;
    const readOptions = typeof options === "function" ? undefined : options;
    const promise = fileInvoke("read", {
      path: filePath,
      options: readOptions,
    });
    if (cb) callbackResult(promise, cb);
    return cb ? undefined : promise.then(bytes);
  },
  writeFile: (filePath, data, options, callback) => {
    const cb = typeof options === "function" ? options : callback;
    const writeOptions = typeof options === "function" ? undefined : options;
    const promise = fileInvoke("write", {
      path: filePath,
      data: bytes(data),
      options: writeOptions,
    });
    if (cb) promise.then(() => cb(null)).catch((error) => cb(error));
    return cb ? undefined : promise;
  },
  promises: {
    readFile: (filePath, options) =>
      fileInvoke("read", { path: filePath, options }).then(bytes),
    readdir: (filePath, options) =>
      fileInvoke("readdir", { path: filePath, options }),
    stat: (filePath) => fileInvoke("stat", { path: filePath }),
    mkdir: (filePath, options) =>
      fileInvoke("mkdir", { path: filePath, options }),
  },
};

const nodeSync = (operation, args = {}) => {
  const result = ipcRenderer.sendSync("node-command-sync", {
    operation,
    ...args,
  });
  if (!result || result.ok !== true) {
    const error = new Error(result?.error?.message || "Node command failed");
    if (result?.error?.code) error.code = result.error.code;
    throw error;
  }
  return result.value;
};
const pathApi = {
  join: (...parts) => nodeSync("path-join", { values: parts }),
  dirname: (value) => nodeSync("path-dirname", { value }),
  basename: (value, suffix) => nodeSync("path-basename", { value, suffix }),
  extname: (value) => nodeSync("path-extname", { value }),
  resolve: (...parts) => nodeSync("path-resolve", { values: parts }),
  posix: { join: (...parts) => nodeSync("path-posix-join", { values: parts }) },
};
const cryptoApi = {
  md5: (data) => nodeSync("crypto-md5", { data: bytes(data) }),
  partialMd5: (filePath) => invoke("partial-md5", filePath),
  fileMd5: (filePath) => invoke("crypto-file-md5", filePath),
};

contextBridge.exposeInMainWorld("electronAPI", {
  invoke,
  send,
  sendSync,
  on: (channel, listener) => listen(channel, listener),
  once: (channel, listener) => listen(channel, listener, true),
  removeListener,
  fs: file,
  path: pathApi,
  os: {
    platform: () => process.platform,
    homedir: () => nodeSync("os-homedir"),
  },
  runtime: {
    platform: process.platform,
    windowsStore: process.windowsStore === true,
  },
  crypto: cryptoApi,
  shell: { openExternal: (url) => invoke("open-external", url) },
  clipboard: {
    readText: () => sendSync("clipboard-read-text-sync"),
  },
});
