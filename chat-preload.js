const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("chatAPI", {
  send: (type, payload) => ipcRenderer.send("chat-message", { type, payload }),
});
