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
  static getReaderConfig(key: string) {
    let readerConfig = JSON.parse(localStorage.getItem("readerConfig")!) || {};
    return readerConfig[key];
  }

  static setReaderConfig(key: string, value: string) {
    let readerConfig = JSON.parse(localStorage.getItem("readerConfig")!) || {};
    readerConfig[key] = value;
    localStorage.setItem("readerConfig", JSON.stringify(readerConfig));
  }

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
}

export default ConfigService;
