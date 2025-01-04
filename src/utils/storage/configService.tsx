const configList = [
  "readerConfig",
  "themeColors",
  "readingTime",
  "recentBooks",
  "deletedBooks",
  "favoriteBooks",
  "shelfList",
  "noteTags",
  "recordLocation",
];
class ConfigService {
  static getConfigJson = () => {
    let config = {};
    for (let i = 0; i < configList.length; i++) {
      let item = configList[i];
      if (localStorage.getItem(item)) {
        config[item] = localStorage.getItem(item);
      }
    }
    return config;
  };
  static getReaderConfig(key: string) {
    let readerConfig = JSON.parse(localStorage.getItem("readerConfig")!) || {};
    return readerConfig[key];
  }

  static setReaderConfig(key: string, value: string) {
    let readerConfig = JSON.parse(localStorage.getItem("readerConfig")!) || {};
    readerConfig[key] = value;
    localStorage.setItem("readerConfig", JSON.stringify(readerConfig));
  }

  static getAllListConfig(key: string) {
    let itemArr =
      localStorage.getItem(key) !== "{}" && localStorage.getItem(key)
        ? JSON.parse(localStorage.getItem(key) || "")
        : [];
    return itemArr || [];
  }
  static deleteListConfig(itemName: string, key: string) {
    let itemArr = this.getAllListConfig(key);
    const index = itemArr.indexOf(itemName);
    if (index > -1) {
      itemArr.splice(index, 1);
    }
    this.setAllListConfig(itemArr, key);
  }
  static setListConfig(itemName: string, key: string) {
    let itemArr = this.getAllListConfig(key);
    const index = itemArr.indexOf(itemName);
    if (index > -1) {
      itemArr.splice(index, 1);
      itemArr.unshift(itemName);
    } else {
      itemArr.unshift(itemName);
    }

    this.setAllListConfig(itemArr, key);
  }
  static setAllListConfig(itemArr: string[], key: string) {
    localStorage.setItem(key, JSON.stringify(itemArr));
  }

  static setObjectConfig(itemName: string, item: any, key: string) {
    let obj = this.getAllObjectConfig(key);
    obj[itemName] = item;
    this.setAllObjectConfig(obj, key);
  }

  static getObjectConfig(itemName: string, key: string, defaultValue: any) {
    let obj = this.getAllObjectConfig(key);
    return obj[itemName] || defaultValue;
  }
  static getAllObjectConfig(key: string) {
    let json = localStorage.getItem(key);
    let obj = JSON.parse(json!) || {};
    return obj;
  }
  static setAllObjectConfig(obj: any, key: string) {
    localStorage.setItem(key, JSON.stringify(obj));
  }
  static deleteObjectConfig(itemName: string, key: string) {
    let obj = this.getAllObjectConfig(key);
    delete obj[itemName];
    this.setAllObjectConfig(obj, key);
  }
  static getAllMapConfig(key: string) {
    let json = localStorage.getItem(key);
    let obj = JSON.parse(json!) || {};
    return obj;
  }
  static getMapConfig(objectName: string, key: string) {
    let obj = this.getAllMapConfig(key);
    return obj[objectName] || [];
  }
  static setAllMapConfig(obj: any, key: string) {
    localStorage.setItem(key, JSON.stringify(obj));
  }
  static setMapConfig(objectName: string, itemName: string, key: string) {
    let obj = this.getAllMapConfig(key);
    if (obj[objectName] === undefined) {
      obj[objectName] = [];
    }
    if (itemName && obj[objectName].indexOf(itemName) === -1) {
      obj[objectName].unshift(itemName);
    }
    this.setAllMapConfig(obj, key);
  }
  static deleteFromMapConfig(
    objectName: string,
    itemName: string,
    key: string
  ) {
    let obj = this.getAllMapConfig(key);
    let index = obj[objectName].indexOf(itemName);
    obj[objectName].splice(index, 1);
    this.setAllMapConfig(obj, key);
  }
  static deleteFromAllMapConfig(itemName: string, key: string) {
    let obj = this.getAllMapConfig(key);
    let objectNameList = Object.keys(obj);
    objectNameList.forEach((item) => {
      let index = obj[item].indexOf(itemName);
      if (index > -1) {
        obj[item].splice(index, 1);
      }
    });
    this.setAllMapConfig(obj, key);
  }
  static deleteMapConfig(objectName: string, key: string) {
    let obj = this.getAllMapConfig(key);
    delete obj[objectName];
    this.setAllMapConfig(obj, key);
  }
  static getFromAllMapConfig(itemName: string, key: string) {
    let obj = this.getAllMapConfig(key);
    let objectNameList: string[] = [];
    for (let item in obj) {
      if (obj[item] && obj[item].indexOf(itemName) > -1) {
        objectNameList.push(item);
      }
    }
    return objectNameList;
  }
}

export default ConfigService;
