const storage = {};
const dbPromise = (function () {
  return new Promise((resolve) => {
    const dbOpen = indexedDB.open("reader");
    dbOpen.addEventListener("success", (event) => {
      resolve(dbOpen.result);
    });
    dbOpen.addEventListener("upgradeneeded", (event) => {
      const db = dbOpen.result;
      db.createObjectStore("content");
      db.createObjectStore("index", { keyPath: "id" });
      db.createObjectStore("config");
      db.createObjectStore("list", { keyPath: "id", autoIncrement: true });
    });
  });
})();

const files = {};

storage.files = files;

files.add = function (meta, content) {
  return new Promise(async (resolve, reject) => {
    const db = await dbPromise;
    const transaction = db.transaction(
      ["content", "list", "index"],
      "readwrite"
    );
    const addFile = transaction.objectStore("list").add(meta);
    addFile.addEventListener("success", (event) => {
      const id = (meta.id = addFile.result);
      const addContent = transaction.objectStore("content").add(content, id);
      addContent.addEventListener("success", (event) => {
        const addIndex = transaction.objectStore("index").add({ id });
        addIndex.addEventListener("success", (event) => {
          resolve(meta);
        });
        addIndex.addEventListener("error", (event) => {
          reject(addIndex.error);
        });
      });
      addContent.addEventListener("error", (event) => {
        reject(addContent.error);
      });
    });
    addFile.addEventListener("error", (event) => {
      reject(addFile.error);
    });
  });
};

files.remove = function (id) {
  return new Promise(async (resolve, reject) => {
    const db = await dbPromise;
    const transaction = db.transaction(
      ["content", "list", "index"],
      "readwrite"
    );
    const deleteFile = transaction.objectStore("list").delete(id);
    deleteFile.addEventListener("success", (event) => {
      const deleteContent = transaction.objectStore("content").delete(id);
      deleteContent.addEventListener("success", (event) => {
        const deleteIndex = transaction.objectStore("index").delete(id);
        deleteIndex.addEventListener("success", (event) => {
          resolve();
        });
        deleteIndex.addEventListener("error", (event) => {
          reject();
        });
      });
      deleteContent.addEventListener("error", (event) => {
        reject();
      });
    });
    deleteFile.addEventListener("error", (event) => {
      reject();
    });
  });
};

const common = function (type, actionType) {
  const action = {
    get: (store, id) => store.get(id),
    put: (store, ...param) => store.put(...param),
    getAll: (store) => store.getAll(),
  }[actionType];
  const mode = { put: "readwrite" }[actionType] || "readonly";
  return async function (...param) {
    return new Promise(async (resolve, reject) => {
      const db = await dbPromise;
      const transaction = db.transaction([type], mode);
      const store = transaction.objectStore(type);
      const request = action(store, ...param);
      request.onsuccess = function (event) {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  };
};

files.list = common("list", "getAll");
files.getContent = common("content", "get");
files.getMeta = common("list", "get");
files.setMeta = common("list", "put");
files.getIndex = common("index", "get");
files.setIndex = common("index", "put");

storage.config = {
  getItem: common("config", "get"),
  setItem: common("config", "put"),
};

const config = {};
const listenerList = [];

config.get = async (name) => {
  let value = await storage.config.getItem(name);
  return value;
};

config.set = async (name, value) => {
  await storage.config.setItem(value, name);
  Promise.resolve().then(() => {
    listenerList.forEach((i) => {
      if (i.name === name) i.listener(value);
    });
  });
  return value;
};

const findListener = (name, listener) => {
  return listenerList.findIndex(
    (i) => i.name === name && i.listener === listener
  );
};

config.addListener = (name, listener) => {
  const pos = findListener(name, listener);
  if (pos === -1) listenerList.push({ name, listener });
};

config.removeListener = (name, listener) => {
  const pos = findListener(name, listener);
  if (pos !== -1) listenerList.splice(pos, 1);
};

const text = {};

export default text;

const encodings = [
  { encoding: "utf-8", fatal: true },
  { encoding: "gbk", fatal: true },
  { encoding: "big5", fatal: true },
  { encoding: "utf-16le", fatal: true },
  { encoding: "utf-16be", fatal: true },
  { encoding: "utf-8", fatal: false },
];

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
text.readFile = async function (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", (event) => {
      const result = reader.result;
      const text = encodings.reduce((text, { encoding, fatal }) => {
        if (text != null) return text;
        const decoder = new TextDecoder(encoding, { fatal });
        try {
          return decoder.decode(result);
        } catch (e) {
          return null;
        }
      }, null);
      if (text) resolve(text);
      reject(null);
    });
    reader.addEventListener("error", (event) => {
      reject(reader.error);
    });
    reader.readAsArrayBuffer(file);
  });
};

text.parseFilename = function (filename) {
  return filename.replace(/\.[^.]+$/, "");
};

/**
 * @param {string} text
 * @param {string} template
 */
text.generateContent = function (text, template) {
  const maxLength = 100;
  let matchReg = null;
  if (/\/.*\/[a-zA-Z]*/.test(template)) {
    const [_, reg, flags] = template.match(/\/(.*)\/(.*)/);
    try {
      matchReg = new RegExp(reg, flags);
    } catch (e) {
      matchReg = null;
    }
  }
  if (!matchReg) {
    const escape = template.replace(/./g, (c) => {
      if (c === " ") return "\\s+";
      if (c === "*") return ".*";
      if (c === "?") return ".";
      return c.replace(
        /[-[\]{}()*+?.,\\^$|#\s]/g,
        (c) => `\\u${c.charCodeAt().toString(16).padStart(4, 0)}`
      );
    });
    matchReg = new RegExp(`^\\s*(?:${escape})`, "u");
  }
  const content = [];
  let cursor = 0;
  text.split("\n").forEach((line) => {
    let match = false;
    if (line.length <= maxLength) {
      if (matchReg.test(line)) {
        content.push({
          title: line.trim(),
          cursor,
        });
      }
    }
    cursor += line.length + 1;
  });
  return content;
};

const convertLineEnding = function (text) {
  return text.replace(/\r\n|\r/g, "\n");
};

const maxEmptyLine = async function (text) {
  const setting = await config.get("max_empty_lines");
  if (setting === "disable") return text;
  const max = Number(setting);
  return text.replace(
    new RegExp(`(?:\\n\\s*){${max},}\\n`, "g"),
    "\n".repeat(max + 1)
  );
};

const chineseConvert = async function (text) {
  const setting = await config.get("chinese_convert");
  if (setting === "disable") return text;
  const convertFile = setting === "s2t" ? "./data/s2t.json" : "./data/t2s.json";
  const table = await fetch(convertFile).then((r) => r.json()),
    root = table[0];
  let output = "";
  let state = 0;
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  for (let char of text) {
    while (true) {
      const current = table[state];
      const hasMatch = hasOwnProperty.call(current, char);
      if (!hasMatch && state === 0) {
        output += char;
        break;
      }
      if (hasMatch) {
        const [adding, next] = current[char];
        if (adding) output += adding;
        state = next;
        break;
      }
      const [adding, next] = current[""];
      if (adding) output += adding;
      state = next;
    }
  }
  while (state !== 0) {
    const current = table[state];
    const [adding, next] = current[""];
    if (adding) output += adding;
    state = next;
  }
  return output;
};

text.preprocess = async function (text) {
  const processors = [convertLineEnding, maxEmptyLine, chineseConvert];
  return processors.reduce(async (text, f) => f(await text), text);
};
