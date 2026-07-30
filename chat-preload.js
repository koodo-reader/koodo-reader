const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("chatAPI", {
  send: (type, payload) => ipcRenderer.send("chat-message", { type, payload }),
  on: (cb) => {
    const handler = (_event, data) => cb(data);
    ipcRenderer.on("chat-reply", handler);
    return () => ipcRenderer.removeListener("chat-reply", handler);
  },
});
