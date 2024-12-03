const configList = [
  "readerConfig",
  "themeColors",
  "bookSortCode",
  "noteSortCode",
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
}

export default ConfigService;
